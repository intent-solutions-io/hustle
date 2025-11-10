#!/usr/bin/env python3
"""
Deploy Vertex AI Agent via GitHub Actions

This script deploys a Vertex AI agent using the Vertex AI SDK.
It reads agent configuration from YAML and deploys to Agent Engine.
"""

import argparse
import json
import sys
import yaml
from google.cloud import aiplatform
from google.cloud.aiplatform_v1beta1 import AgentServiceClient
from google.cloud.aiplatform_v1beta1.types import Agent, Tool


def load_agent_config(config_path):
    """Load agent configuration from YAML file."""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def load_agent_card(card_path):
    """Load agent card from JSON file."""
    try:
        with open(card_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None


def deploy_agent(project_id, region, agent_name, config, agent_card=None):
    """Deploy agent to Vertex AI Agent Engine."""

    print(f"🚀 Deploying agent: {agent_name}")
    print(f"   Project: {project_id}")
    print(f"   Region: {region}")

    # Initialize Vertex AI
    aiplatform.init(project=project_id, location=region)

    # Create agent client
    client = AgentServiceClient(
        client_options={"api_endpoint": f"{region}-aiplatform.googleapis.com"}
    )

    parent = f"projects/{project_id}/locations/{region}"

    # Build agent configuration
    agent_config = config.get('agent', {})

    # Create agent request
    agent = Agent(
        display_name=agent_name,
        description=agent_config.get('description', ''),
        # Model configuration
        default_language_code='en',
    )

    # Add tools if specified
    tools = agent_config.get('tools', [])
    for tool_config in tools:
        tool = Tool(
            name=tool_config.get('name'),
            description=tool_config.get('description'),
        )
        agent.tools.append(tool)

    try:
        # Check if agent already exists
        agents = client.list_agents(parent=parent)
        existing_agent = None

        for existing in agents:
            if existing.display_name == agent_name:
                existing_agent = existing
                break

        if existing_agent:
            print(f"   ℹ️  Agent already exists, updating...")
            # Update existing agent
            response = client.update_agent(agent=agent)
            print(f"   ✅ Agent updated successfully")
        else:
            print(f"   ℹ️  Creating new agent...")
            # Create new agent
            response = client.create_agent(parent=parent, agent=agent)
            print(f"   ✅ Agent created successfully")

        # Get agent endpoint
        agent_endpoint = response.name
        print(f"   📍 Agent endpoint: {agent_endpoint}")

        # Save agent endpoint to file for Cloud Functions
        endpoint_data = {
            'agent_name': agent_name,
            'endpoint': agent_endpoint,
            'project': project_id,
            'region': region
        }

        with open(f'.github/outputs/{agent_name}-endpoint.json', 'w') as f:
            json.dump(endpoint_data, f, indent=2)

        return True

    except Exception as e:
        print(f"   ❌ Deployment failed: {str(e)}")
        print(f"   ℹ️  Note: Full ADK agent deployment may require manual console setup")
        print(f"   ℹ️  Agent configuration saved for manual deployment")

        # Save config for manual deployment
        manual_config = {
            'agent_name': agent_name,
            'project': project_id,
            'region': region,
            'config': config,
            'agent_card': agent_card
        }

        with open(f'.github/outputs/{agent_name}-manual-config.json', 'w') as f:
            json.dump(manual_config, f, indent=2)

        return False


def main():
    parser = argparse.ArgumentParser(description='Deploy Vertex AI Agent')
    parser.add_argument('--project', required=True, help='GCP Project ID')
    parser.add_argument('--region', required=True, help='GCP Region')
    parser.add_argument('--agent-name', required=True, help='Agent name')
    parser.add_argument('--config', required=True, help='Path to agent config YAML')
    parser.add_argument('--agent-card', help='Path to agent card JSON')

    args = parser.parse_args()

    # Create output directory
    import os
    os.makedirs('.github/outputs', exist_ok=True)

    # Load configurations
    config = load_agent_config(args.config)
    agent_card = load_agent_card(args.agent_card) if args.agent_card else None

    # Deploy agent
    success = deploy_agent(
        args.project,
        args.region,
        args.agent_name,
        config,
        agent_card
    )

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
