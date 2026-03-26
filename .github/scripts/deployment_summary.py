#!/usr/bin/env python3
"""
Deployment Summary

This script generates a summary of the agent deployment.
"""

import argparse
import json
import glob


def generate_summary(project_id, region):
    """Generate deployment summary."""

    print("\n" + "="*60)
    print("VERTEX AI AGENT DEPLOYMENT SUMMARY")
    print("="*60)
    print(f"\nProject: {project_id}")
    print(f"Region: {region}")

    # Check for deployed agents
    endpoint_files = glob.glob('.github/outputs/*-endpoint.json')

    if endpoint_files:
        print(f"\n✅ Deployed Agents ({len(endpoint_files)}):")
        for endpoint_file in endpoint_files:
            with open(endpoint_file, 'r') as f:
                data = json.load(f)
                print(f"   • {data['agent_name']}")
                print(f"     Endpoint: {data['endpoint']}")
    else:
        print("\n⚠️  No agents deployed via automation")

    # Check for manual configs
    manual_files = glob.glob('.github/outputs/*-manual-config.json')

    if manual_files:
        print(f"\n📋 Manual Deployment Required ({len(manual_files)}):")
        for manual_file in manual_files:
            with open(manual_file, 'r') as f:
                data = json.load(f)
                print(f"   • {data['agent_name']}")
        print("\n   ℹ️  Manual deployment instructions:")
        print("   → Go to: https://console.cloud.google.com/vertex-ai/agents")
        print("   → Use configurations saved in .github/outputs/")

    print("\n" + "="*60)
    print("NEXT STEPS:")
    print("="*60)

    if manual_files:
        print("\n1. Deploy agents manually via Vertex AI Console")
        print("2. Test agent endpoints")
        print("3. Verify Cloud Functions integration")
    else:
        print("\n✅ Automated deployment complete!")
        print("1. Verify agent endpoints")
        print("2. Run integration tests")
        print("3. Monitor agent performance")

    print("\n📖 Full documentation:")
    print("   → 000-docs/173-OD-DEPL-vertex-ai-a2a-deployment-guide.md")
    print("\n" + "="*60 + "\n")

    return True


def main():
    parser = argparse.ArgumentParser(description='Generate Deployment Summary')
    parser.add_argument('--project', required=True, help='GCP Project ID')
    parser.add_argument('--region', required=True, help='GCP Region')

    args = parser.parse_args()

    generate_summary(args.project, args.region)


if __name__ == '__main__':
    main()
