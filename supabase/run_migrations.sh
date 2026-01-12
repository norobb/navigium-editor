#!/bin/bash

# Script to run Supabase migrations
# Make sure you have Supabase CLI installed: npm install -g supabase

echo "Running Supabase migrations..."

# Initialize if not already done
supabase db reset

echo "Migration completed. Check your Supabase dashboard for the tables."