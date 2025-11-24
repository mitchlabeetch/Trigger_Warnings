# Critical Issues Analysis - Trigger Warnings Extension

## Overview
After fixing the seed data constraint violation, I identified **3 critical issues** in the codebase that could cause similar failures in production.

---

## Issue 1: Database Trigger Function Doesn't Handle NULL Values ⚠️

### Location
`database/schema.sql` lines 451-467

### Problem
The `increment_user_submissions()` function attempts to insert/update user_profiles **without checking if `submitted_by` is NULL**:

```sql
CREATE OR REPLACE FUNCTION increment_user_submissions()
RETURNS TRIGGER AS $$
BEGIN
  -- ❌ PROBLEM: No NULL check here!
  INSERT INTO user_profiles (id, display_name)
  VALUES (NEW.submitted_by, 'User ' || substring(NEW.submitted_by::text, 1, 8))
  ON CONFLICT (id) DO NOTHING;

  -- ❌ PROBLEM: This will fail if NEW.submitted_by is NULL
  UPDATE user_profiles
  SET submissions_count = submissions_count + 1,
      updated_at = NOW()
  WHERE id = NEW.submitted_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Impact
- **Seed data inserts fail** (which we already fixed by disabling the trigger)
- **Production edge case**: If somehow `submitted_by` is NULL, the function will try to create a user_profile with `id = NULL`, violating the NOT NULL constraint
- **Silent failures**: The UPDATE won't error but won't update anything either

### Recommended Fix
Add NULL check at the beginning of the function:

```sql
CREATE OR REPLACE FUNCTION increment_user_submissions()
RETURNS TRIGGER AS $$
BEGIN
  -- ✅ FIX: Check if submitted_by is NULL (e.g., system-generated data)
  IF NEW.submitted_by IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert user profile if it doesn't exist
  INSERT INTO user_profiles (id, display_name)
  VALUES (NEW.submitted_by, 'User ' || substring(NEW.submitted_by::text, 1, 8))
  ON CONFLICT (id) DO NOTHING;

  -- Increment submissions count
  UPDATE user_profiles
  SET submissions_count = submissions_count + 1,
      updated_at = NOW()
  WHERE id = NEW.submitted_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Issue 2: Extension Uses String 'anonymous' Instead of NULL/UUID ⚠️⚠️

### Location
`src/core/api/SupabaseClient.ts` line 100-102

### Problem
When anonymous sign-in fails or hasn't completed yet, `getUserId()` returns the **string** `'anonymous'`:

```typescript
static getUserId(): string {
  return this.userId || 'anonymous';  // ❌ PROBLEM: Returns string, not NULL or UUID
}
```

This string `'anonymous'` is then used as `submitted_by` when inserting triggers:

```typescript
// Line 264-273
const userId = this.getUserId();  // Could be string 'anonymous'

const { error } = await client.from('triggers').insert({
  video_id: submission.videoId,
  platform: submission.platform,
  category_key: submission.categoryKey,
  start_time: submission.startTime,
  end_time: submission.endTime,
  description: submission.description || null,
  submitted_by: userId,  // ❌ PROBLEM: Could be string 'anonymous', not a UUID!
  status: 'pending',
  score: 0,
  confidence_level: submission.confidence || 75,
});
```

### Database Schema
The `triggers` table expects a **UUID** that references `auth.users(id)`:

```sql
submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
```

### Impact
1. **Foreign Key Violation**: The string `'anonymous'` is NOT a valid UUID and doesn't exist in `auth.users` table
2. **Insert will fail** with error: "invalid input syntax for type uuid" or "foreign key constraint violation"
3. **Same issue in 3 places**:
   - `submitTrigger()` - line 273
   - `voteTrigger()` - line 312 (user_id field)
   - `submitFeedback()` - line 374

### Recommended Fix

**Option A: Use NULL when not signed in** (Recommended)
```typescript
static getUserId(): string | null {
  return this.userId || null;  // ✅ Returns NULL instead of 'anonymous'
}
```

Then update the calls to handle NULL:
```typescript
const userId = this.getUserId();

// Only allow submissions if user is signed in
if (!userId) {
  console.error('[TW Supabase] Cannot submit without user authentication');
  return false;
}

const { error } = await client.from('triggers').insert({
  // ... other fields
  submitted_by: userId,  // Now guaranteed to be a valid UUID
});
```

**Option B: Wait for sign-in before allowing operations**
```typescript
static async submitTrigger(submission: TriggerSubmission): Promise<boolean> {
  // Ensure user is signed in first
  await this.getInstance();  // This calls signInAnonymously()

  const userId = this.getUserId();
  if (!userId || userId === 'anonymous') {
    console.error('[TW Supabase] User not authenticated yet');
    return false;
  }

  // Continue with insert...
}
```

---

## Issue 3: RLS Policy Mismatch with String 'anonymous' ⚠️

### Location
- Database: `database/schema.sql` lines 337-339
- Extension: `src/core/api/SupabaseClient.ts`

### Problem
Row Level Security (RLS) policies check `auth.uid()` which returns the **actual UUID** from Supabase auth:

```sql
-- From schema.sql line 317-318
CREATE POLICY "Authenticated users can submit triggers"
  ON triggers FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);
```

But the extension sends the **string** `'anonymous'`:
- `auth.uid()` returns a UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- Extension sends `'anonymous'` as a string

### Impact
1. **Policy violation**: `auth.uid()` will NEVER equal the string `'anonymous'`
2. **Insert will be blocked** by RLS even if foreign key was somehow bypassed
3. **Same issue for voting**: `trigger_votes` has policy `auth.uid() = user_id`

### RLS Policies Affected
```sql
-- Triggers
CREATE POLICY "Authenticated users can submit triggers"
  ON triggers FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- Votes
CREATE POLICY "Users can vote on triggers"
  ON trigger_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Feedback
CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);
```

### Verification
Check what `auth.uid()` actually returns when signed in anonymously:
```sql
SELECT auth.uid();  -- Returns UUID like 550e8400-e29b-41d4-a716-446655440000
```

The string `'anonymous'` will never match.

### Recommended Fix
Same as Issue 2 - ensure `getUserId()` returns the actual UUID from `this.userId` after successful anonymous sign-in, or NULL if not signed in.

---

## Issue 4: Silent Failure if Anonymous Sign-In Fails ⚠️

### Location
`src/core/api/SupabaseClient.ts` lines 70-95

### Problem
If anonymous sign-in fails, the extension **continues to work** but all database operations will silently fail:

```typescript
private static async signInAnonymously(): Promise<void> {
  try {
    // ... sign-in attempt
    if (data?.user) {
      this.userId = data.user.id;
      console.log('[TW Supabase] Signed in anonymously:', this.userId);
    }
  } catch (error) {
    console.error('[TW Supabase] Error signing in:', error);
    // ❌ PROBLEM: Extension continues with this.userId still undefined
    // Extension continues to work without Supabase connection
  }
}
```

### Impact
- `this.userId` remains `undefined`
- `getUserId()` returns `'anonymous'` string
- All subsequent INSERT operations fail
- User has no indication that submissions aren't working

### Recommended Fix
Set a flag indicating Supabase is unavailable:

```typescript
private static supabaseAvailable = false;

private static async signInAnonymously(): Promise<void> {
  try {
    // ... sign-in attempt
    if (data?.user) {
      this.userId = data.user.id;
      this.supabaseAvailable = true;
      console.log('[TW Supabase] Signed in anonymously:', this.userId);
    }
  } catch (error) {
    console.error('[TW Supabase] Error signing in:', error);
    this.supabaseAvailable = false;
  }
}

static async submitTrigger(submission: TriggerSubmission): Promise<boolean> {
  if (!this.supabaseAvailable) {
    console.error('[TW Supabase] Supabase not available - cannot submit');
    // Show user-friendly error message
    return false;
  }
  // ... continue
}
```

---

## Summary Table

| Issue | Severity | Location | Impact | Users Affected |
|-------|----------|----------|--------|----------------|
| 1. DB trigger doesn't check NULL | Medium | `database/schema.sql:451-467` | Seed data fails, edge cases fail | Admins inserting test data |
| 2. String 'anonymous' instead of UUID | **CRITICAL** | `src/core/api/SupabaseClient.ts:100` | All submissions fail | **ALL users** |
| 3. RLS policy mismatch | **CRITICAL** | Multiple files | Insert blocked by RLS | **ALL users** |
| 4. Silent failure on auth error | High | `src/core/api/SupabaseClient.ts:70-95` | Users think they submitted but didn't | Users with auth failures |

---

## Testing Recommendations

### Test 1: Verify getUserId() Returns UUID
1. Load extension
2. Open console
3. Check that `[TW Supabase] Signed in anonymously: <UUID>` appears
4. If you see UUID, good. If not, Issue 2 will occur.

### Test 2: Try Submitting a Trigger
1. Go to test video
2. Try to submit a warning
3. Check console for errors
4. If you see "foreign key constraint" or "invalid UUID", Issue 2 is confirmed

### Test 3: Check Database
```sql
-- Check if any triggers have invalid UUIDs
SELECT submitted_by
FROM triggers
WHERE submitted_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = triggers.submitted_by);
```

---

## Recommended Priority

1. **IMMEDIATE**: Fix Issue 2 - Change `getUserId()` to return NULL instead of 'anonymous' string
2. **HIGH**: Fix Issue 4 - Add proper error handling and user feedback
3. **MEDIUM**: Fix Issue 1 - Add NULL check to database trigger function
4. **Issue 3** will be automatically fixed when Issue 2 is fixed

---

## Questions for Discussion

1. **Should users be allowed to submit triggers anonymously?**
   - If YES: Keep anonymous sign-in, but fix getUserId() to return actual UUID
   - If NO: Require email authentication before allowing submissions

2. **What should happen if Supabase is unavailable?**
   - Show error message to user?
   - Queue submissions locally and retry later?
   - Disable submit button entirely?

3. **Should test data have actual user associations?**
   - Current approach: NULL submitted_by (requires disabling trigger)
   - Alternative: Create a test user in auth.users and use that UUID

---

**Status**: All issues identified and documented. Awaiting decision on fixes.
