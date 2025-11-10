#!/usr/bin/env python3
"""
Verify Vertex AI Agent Deployments

This script verifies that all agents are deployed and accessible.
"""

import argparse
import sys
from google.cloud import aiplatform
from google.cloud.aiplatform_v1beta1 import AgentServiceClient


def verify_agents(project_id, region):
    """Verify all agents are deployed."""

    print("🔍 Verifying agent deployments...")

    required_agents = [
        'hustle-operations-manager',
        'hustle-validation-agent',
        'hustle-user-creation-agent',
        'hustle-onboarding-agent',
        'hustle-analytics-agent'
    ]

    # Initialize client
    client = AgentServiceClient(
        client_options={"api_endpoint": f"{region}-aiplatform.googleapis.com"}
    )

    parent = f"projects/{project_id}/locations/{region}"

    try:
        # List all agents
        agents = client.list_agents(parent=parent)
        deployed_agents = {agent.display_name: agent for agent in agents}

        all_deployed = True

        for agent_name in required_agents:
            if agent_name in deployed_agents:
                print(f"   ✅ {agent_name}: Deployed")
            else:
                print(f"   ❌ {agent_name}: Not found")
                all_deployed = False

        if all_deployed:
            print("\n✅ All agents verified successfully")
            return True
        else:
            print("\n⚠️  Some agents are missing")
            print("   Manual console deployment may be required")
            return False

    except Exception as e:
        print(f"❌ Verification failed: {str(e)}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Verify Vertex AI Agents')
    parser.add_argument('--project', required=True, help='GCP Project ID')
    parser.add_argument('--region', required=True, help='GCP Region')

    args = parser.parse_args()

    success = verify_agents(args.project, args.region)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
