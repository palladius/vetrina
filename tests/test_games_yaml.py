#!/usr/bin/env python3
"""
Unit and integrity test suite for Palladius Showcase data.
Validates data/games.yaml against schema rules, missing screenshots, invalid URLs, and type errors.
Run directly via 'python3 tests/test_games_yaml.py'.
"""

import os
import sys
import unittest
import urllib.parse
import yaml

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
YAML_FILE = os.path.join(PROJECT_ROOT, 'data', 'games.yaml')

ALLOWED_AUDIENCES = {'kids', 'journals', 'tools'}
ALLOWED_KINDS = {'game', 'educational', 'journal', 'tool'}
REQUIRED_FIELDS = ['id', 'title', 'audience', 'kind', 'tagline', 'description', 'screenshot']

class TestGamesYaml(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not os.path.isfile(YAML_FILE):
            raise FileNotFoundError(f'Missing games.yaml at {YAML_FILE}')
        with open(YAML_FILE, 'r', encoding='utf-8') as f:
            cls.data = yaml.safe_load(f)

    def test_yaml_is_list(self):
        self.assertIsInstance(self.data, list, 'games.yaml root must be a list of dictionaries')
        self.assertGreater(len(self.data), 0, 'games.yaml cannot be empty')

    def test_unique_ids(self):
        ids = [item.get('id') for item in self.data if isinstance(item, dict)]
        duplicates = [x for x in ids if ids.count(x) > 1]
        self.assertEqual(len(ids), len(set(ids)), f'Duplicate IDs detected: {set(duplicates)}')
        for item_id in ids:
            self.assertTrue(item_id and isinstance(item_id, str), f'Invalid ID: {item_id}')
            self.assertNotIn(' ', item_id, f"ID cannot contain spaces: '{item_id}'")

    def test_unique_urls(self):
        """Ensure primary keys (repo_url and play_url) are unique across projects."""
        repos = {}
        plays = {}
        for item in self.data:
            item_id = item.get('id', '<unknown>')
            repo = (item.get('repo_url') or '').strip().rstrip('/')
            play = (item.get('play_url') or '').strip().rstrip('/')

            if repo:
                self.assertNotIn(repo, repos, f"Duplicate repo_url '{repo}' in '{item_id}' (already in '{repos.get(repo)}')")
                repos[repo] = item_id

            if play:
                self.assertNotIn(play, plays, f"Duplicate play_url '{play}' in '{item_id}' (already in '{plays.get(play)}')")
                plays[play] = item_id

    def test_required_fields(self):
        for item in self.data:
            item_id = item.get('id', '<unknown>')
            for req in REQUIRED_FIELDS:
                self.assertIn(req, item, f"[{item_id}] Missing required field: '{req}'")
                self.assertTrue(str(item[req]).strip(), f"[{item_id}] Field '{req}' cannot be empty")

    def test_audiences_and_kinds(self):
        for item in self.data:
            item_id = item.get('id')
            audience = item.get('audience')
            kind = item.get('kind')
            self.assertIn(audience, ALLOWED_AUDIENCES, f"[{item_id}] Invalid audience '{audience}'")
            self.assertIn(kind, ALLOWED_KINDS, f"[{item_id}] Invalid kind '{kind}'")

    def test_scores_in_range(self):
        for item in self.data:
            item_id = item.get('id')
            score = item.get('score')
            if score is not None:
                self.assertIsInstance(score, (int, float), f"[{item_id}] Score must be numeric")
                self.assertGreaterEqual(score, 1, f"[{item_id}] Score must be >= 1")
                self.assertLessEqual(score, 100, f"[{item_id}] Score must be <= 100")

    def test_screenshots_exist_on_disk(self):
        missing = []
        for item in self.data:
            item_id = item.get('id')
            shot = item.get('screenshot')
            if shot:
                full_path = os.path.join(PROJECT_ROOT, shot)
                if not os.path.isfile(full_path):
                    missing.append(f"[{item_id}] File not found: {shot}")
        self.assertEqual(len(missing), 0, "Missing screenshots: " + ", ".join(missing))

    def test_valid_urls(self):
        url_keys = ['play_url', 'repo_url', 'youtube_url', 'article_url', 'issue_url']
        for item in self.data:
            item_id = item.get('id')
            for k in url_keys:
                url = item.get(k)
                if url:
                    parsed = urllib.parse.urlparse(url)
                    self.assertIn(parsed.scheme, ['http', 'https'], f"[{item_id}] Invalid scheme for {k}: {url}")

    def test_tags_and_tech_format(self):
        for item in self.data:
            item_id = item.get('id')
            if 'tags' in item and item['tags'] is not None:
                self.assertIsInstance(item['tags'], list, f"[{item_id}] 'tags' must be a list")
            if 'tech' in item and item['tech'] is not None:
                self.assertIsInstance(item['tech'], list, f"[{item_id}] 'tech' must be a list")

if __name__ == '__main__':
    suite = unittest.TestLoader().loadTestsFromTestCase(TestGamesYaml)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
