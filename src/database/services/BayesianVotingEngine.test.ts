import { describe, it, expect, beforeEach } from 'vitest';
import { BayesianVotingEngine } from './BayesianVotingEngine';
import type { TriggerCategory } from '@shared/types/Warning.types';
import type { UserExpertise } from '../schemas/CommunityVotingSchemas';

describe('BayesianVotingEngine', () => {
  let engine: BayesianVotingEngine;

  beforeEach(() => {
    engine = new BayesianVotingEngine();
  });

  describe('updateUserExpertise', () => {
    it('should correctly update reputation score', () => {
      const mockExpertise: UserExpertise = {
        userId: 'test-user',
        categoryExpertise: {
          'vomit': 50,
          'blood': 50
        } as Record<TriggerCategory, number>,
        totalContributions: 0,
        acceptedContributions: 0,
        rejectedContributions: 0,
        totalVotes: 10,
        consensusAgreementRate: 0.5,
        reputationScore: 0,
        level: 'novice',
        accountAge: 100,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = engine.updateUserExpertise(
        'test-user',
        'vomit' as TriggerCategory,
        mockExpertise,
        true // voted with consensus
      );

      expect(result.categoryExpertise['vomit']).toBe(52);
      expect(result.reputationScore).toBe(51);
    });

    it('should handle missing consensusAgreementRate gracefully', () => {
      // Simulate partial object from DB or legacy data
      const mockExpertise = {
        userId: 'test-user',
        categoryExpertise: {
          'vomit': 50
        },
        totalContributions: 0,
        acceptedContributions: 0,
        rejectedContributions: 0,
        totalVotes: 10,
        // consensusAgreementRate is MISSING
        reputationScore: 0,
        level: 'novice',
        accountAge: 100,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as UserExpertise;

      const result = engine.updateUserExpertise(
        'test-user',
        'vomit' as TriggerCategory,
        mockExpertise,
        true
      );

      // Should not be NaN
      expect(result.consensusAgreementRate).not.toBeNaN();
      // Should be close to: 0.1 * 1 + 0.9 * 0.5 (default) = 0.55
      // OR if it defaults to 0: 0.1 * 1 + 0.9 * 0 = 0.1
      // Ideally it defaults to 0.5 (neutral)
    });
  });
});
