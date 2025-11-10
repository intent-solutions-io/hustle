#!/usr/bin/env python3
"""
Update Cloud Functions with Agent Endpoints

This script reads deployed agent endpoints and updates the Cloud Functions
configuration to use the correct agent URLs.
"""

import argparse
import json
import glob
import sys


def update_endpoints(project_id, region, output_path):
    """Update Cloud Functions with agent endpoints."""

    print("📝 Updating Cloud Functions with agent endpoints...")

    endpoints = {}

    # Read all endpoint files
    endpoint_files = glob.glob('.github/outputs/*-endpoint.json')

    for endpoint_file in endpoint_files:
        with open(endpoint_file, 'r') as f:
            data = json.load(f)
            agent_name = data['agent_name']
            endpoints[agent_name] = data['endpoint']
            print(f"   ✅ Found endpoint for {agent_name}")

    # Create endpoints configuration
    config = {
        'project_id': project_id,
        'region': region,
        'agents': endpoints,
        'generated_at': __import__('datetime').datetime.utcnow().isoformat() + 'Z'
    }

    # Write configuration
    with open(output_path, 'w') as f:
        json.dump(config, f, indent=2)

    print(f"\n✅ Endpoints configuration saved to {output_path}")
    print(f"   Total agents: {len(endpoints)}")

    return True


def main():
    parser = argparse.ArgumentParser(description='Update Function Endpoints')
    parser.add_argument('--project', required=True, help='GCP Project ID')
    parser.add_argument('--region', required=True, help='GCP Region')
    parser.add_argument('--output', required=True, help='Output file path')

    args = parser.parse_args()

    success = update_endpoints(args.project, args.region, args.output)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
