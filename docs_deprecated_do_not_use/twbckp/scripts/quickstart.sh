#!/bin/bash

# Data Import Quickstart Script
# This script helps you import trigger warnings from IMDb Parental Guide

set -e  # Exit on error

echo "🎬 Trigger Warnings - Data Import Quickstart"
echo "============================================="
echo ""

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
echo "1) Import from IMDb Parental Guide (Kaggle CSV)"
echo "2) Process SQL file for platform mapping"
echo "3) Exit"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
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

    2)
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

    3)
        echo "Exiting..."
        exit 0
        ;;

    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📚 Next Steps:"
echo "   1. Review the generated SQL/JSON file"
echo "   2. Map video IDs to platform-specific IDs (use option 2)"
echo "   3. Add real timestamps where available"
echo "   4. Import to your Supabase database"
echo ""
echo "For more information, see scripts/README.md"
