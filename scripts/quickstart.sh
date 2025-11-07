#!/bin/bash

# DTDD Scraper Quickstart Script
# This script helps you get started with importing data from Does the Dog Die

set -e  # Exit on error

echo "🎬 DTDD Data Import - Quickstart"
echo "=================================="
echo ""

# Check if API key is provided
if [ -f "scripts/.env" ]; then
    echo "✅ Found .env file"
    source scripts/.env
elif [ ! -z "$DTDD_API_KEY" ]; then
    echo "✅ Using DTDD_API_KEY from environment"
else
    echo "❌ No API key found!"
    echo ""
    echo "Please either:"
    echo "  1. Create scripts/.env from scripts/.env.example"
    echo "  2. Set DTDD_API_KEY environment variable"
    echo ""
    echo "Get your API key from: https://www.doesthedogdie.com/profile"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Show menu
echo "What would you like to do?"
echo ""
echo "1) Test with a single movie (recommended first)"
echo "2) Import popular movies (batch)"
echo "3) Search by IMDb ID"
echo "4) Custom search"
echo "5) Import from IMDb Parental Guide (Kaggle)"
echo "6) Process SQL file for platform mapping"
echo ""
read -p "Enter choice (1-6): " choice

case $choice in
    1)
        echo ""
        read -p "Enter movie title (default: The Matrix): " title
        title=${title:-The Matrix}

        echo ""
        echo "🔍 Searching for: $title"
        node scripts/dtdd-scraper.js \
            --api-key "$DTDD_API_KEY" \
            --search "$title" \
            --output sql \
            --confidence 0.7 \
            --min-votes 5

        echo ""
        echo "✅ Done! Check the database/ folder for output"
        echo "   Review the SQL file before importing to your database"
        ;;

    2)
        echo ""
        echo "📋 Batch importing popular movies..."
        echo "   This will take a few minutes (rate limiting)"
        echo ""

        node scripts/dtdd-scraper.js \
            --api-key "$DTDD_API_KEY" \
            --batch scripts/popular-movies.txt \
            --output sql \
            --confidence 0.75 \
            --min-votes 8

        echo ""
        echo "✅ Done! Check the database/ folder for output"
        ;;

    3)
        echo ""
        read -p "Enter IMDb ID (e.g., tt0133093): " imdb_id

        if [[ ! $imdb_id =~ ^tt[0-9]+$ ]]; then
            echo "❌ Invalid IMDb ID format (should be ttXXXXXXX)"
            exit 1
        fi

        echo ""
        echo "🔍 Searching for: $imdb_id"
        node scripts/dtdd-scraper.js \
            --api-key "$DTDD_API_KEY" \
            --imdb "$imdb_id" \
            --output sql

        echo ""
        echo "✅ Done! Check the database/ folder for output"
        ;;

    4)
        echo ""
        read -p "Enter search query: " query
        read -p "Output format (sql/json, default: sql): " format
        format=${format:-sql}
        read -p "Min confidence 0-1 (default: 0.7): " conf
        conf=${conf:-0.7}
        read -p "Min votes (default: 5): " votes
        votes=${votes:-5}

        echo ""
        echo "🔍 Searching for: $query"
        node scripts/dtdd-scraper.js \
            --api-key "$DTDD_API_KEY" \
            --search "$query" \
            --output "$format" \
            --confidence "$conf" \
            --min-votes "$votes"

        echo ""
        echo "✅ Done! Check the database/ folder for output"
        ;;

    5)
        echo ""
        echo "📊 IMDb Parental Guide Import"
        echo ""
        echo "Download the CSV from:"
        echo "https://www.kaggle.com/datasets/barryhaworth/imdb-parental-guide"
        echo ""
        read -p "Enter path to CSV file: " csv_file

        if [ ! -f "$csv_file" ]; then
            echo "❌ File not found: $csv_file"
            exit 1
        fi

        read -p "Limit entries (default: 1000): " limit
        limit=${limit:-1000}

        echo ""
        echo "📋 Processing IMDb data..."
        node scripts/imdb-parser.js \
            --csv "$csv_file" \
            --output sql \
            --limit "$limit"

        echo ""
        echo "✅ Done! Check the database/ folder for output"
        ;;

    6)
        echo ""
        echo "Available SQL files:"
        ls -1 database/*-import-*.sql 2>/dev/null || echo "   No import files found"
        echo ""
        read -p "Enter SQL file path: " sql_file

        if [ ! -f "$sql_file" ]; then
            echo "❌ File not found: $sql_file"
            exit 1
        fi

        read -p "Target platform (netflix/youtube/etc): " platform

        echo ""
        node scripts/platform-id-mapper.js \
            --sql-file "$sql_file" \
            --platform "$platform"
        ;;

    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📚 Next Steps:"
echo "   1. Review the generated SQL/JSON file"
echo "   2. Map video IDs to platform-specific IDs"
echo "   3. Add real timestamps where available"
echo "   4. Import to your Supabase database"
echo ""
echo "For more options, see scripts/README.md"
