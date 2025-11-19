"""
Deploy Hustle Scout Agent to Vertex AI Agent Engine
Following Google ADK deployment standards from https://google.github.io/adk-docs/deploy/agent-engine/
"""

import vertexai
from vertexai import agent_engines
from agent import root_agent

# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ID = "hustleapp-production"
LOCATION = "us-central1"
STAGING_BUCKET = f"gs://{PROJECT_ID}-agent-staging"

# ============================================================================
# DEPLOYMENT SCRIPT
# ============================================================================

def deploy_scout_agent():
    """
    Deploy Scout agent to Vertex AI Agent Engine.

    Following ADK standard deployment path:
    1. Initialize Vertex AI
    2. Wrap agent in AdkApp
    3. Deploy to Agent Engine
    4. Test deployment
    """

    print(f"🚀 Deploying Hustle Scout Agent to Vertex AI Agent Engine")
    print(f"   Project: {PROJECT_ID}")
    print(f"   Location: {LOCATION}")
    print(f"   Staging Bucket: {STAGING_BUCKET}")
    print()

    # Step 1: Initialize Vertex AI
    print("Step 1: Initializing Vertex AI...")
    vertexai.init(
        project=PROJECT_ID,
        location=LOCATION,
        staging_bucket=STAGING_BUCKET,
    )
    print("✅ Vertex AI initialized")
    print()

    # Step 2: Wrap agent in AdkApp with tracing enabled
    print("Step 2: Wrapping agent in AdkApp...")
    app = agent_engines.AdkApp(
        agent=root_agent,
        enable_tracing=True,  # OpenTelemetry tracing for observability
    )
    print("✅ AdkApp created with tracing enabled")
    print()

    # Step 3: Deploy to Agent Engine
    print("Step 3: Deploying to Agent Engine...")
    print("   (This may take a few minutes...)")

    remote_app = agent_engines.create(
        agent_engine=app,
        requirements=[
            "google-adk>=1.18.0",
            "google-cloud-firestore>=2.21.0",
        ],
        display_name="Hustle Scout - Personal Sports Statistician",
        description="Conversational agent for tracking youth athlete statistics and college recruitment journey",
    )

    print("✅ Deployment complete!")
    print()
    print(f"📍 Agent Resource ID: {remote_app.resource_name}")
    print(f"📊 Dashboard: https://console.cloud.google.com/vertex-ai/reasoning-engines?project={PROJECT_ID}")
    print()

    # Step 4: Test deployment by creating a session
    print("Step 4: Testing deployment...")
    try:
        test_session = remote_app.create_session(user_id="test_user_123")
        print(f"✅ Test session created: {test_session['id']}")
        print()
        print("🎉 Deployment successful! Scout agent is live.")
        print()
        print("Next steps:")
        print("1. Test via REST API:")
        print(f"   curl -H 'Authorization: Bearer $(gcloud auth print-access-token)' \\")
        print(f"     https://{LOCATION}-aiplatform.googleapis.com/v1/{remote_app.resource_name}:query \\")
        print(f"     -d '{{\"class_method\": \"query\", \"input\": {{\"user_id\": \"test_user_123\", \"session_id\": \"{test_session['id']}\", \"message\": \"Hello Scout!\"}}}}'")
        print()
        print("2. Integrate with Next.js frontend via /api/scout/chat endpoint")
        print()

        return remote_app

    except Exception as e:
        print(f"⚠️  Test session creation failed: {e}")
        print("   Agent is deployed but may need a moment to become ready.")
        return remote_app


if __name__ == "__main__":
    import sys

    print("=" * 80)
    print("HUSTLE SCOUT AGENT - DEPLOYMENT TO VERTEX AI AGENT ENGINE")
    print("=" * 80)
    print()

    try:
        remote_app = deploy_scout_agent()
        print("=" * 80)
        print("✅ SUCCESS - Scout agent is now live!")
        print("=" * 80)
        sys.exit(0)

    except Exception as e:
        print()
        print("=" * 80)
        print(f"❌ ERROR: Deployment failed")
        print(f"   {str(e)}")
        print("=" * 80)
        print()
        print("Troubleshooting:")
        print("1. Ensure GCP authentication: gcloud auth application-default login")
        print("2. Verify project access: gcloud config set project hustleapp-production")
        print("3. Check Vertex AI API is enabled:")
        print("   gcloud services enable aiplatform.googleapis.com --project=hustleapp-production")
        print("4. Verify staging bucket exists:")
        print(f"   gsutil ls {STAGING_BUCKET} || gsutil mb -p {PROJECT_ID} -l {LOCATION} {STAGING_BUCKET}")
        print()
        sys.exit(1)
