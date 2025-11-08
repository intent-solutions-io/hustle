# Terraform for Promptlandia

This directory contains the Terraform configuration for deploying the Promptlandia application to Google Cloud.

## Prerequisites

*   [Terraform CLI](https://learn.hashicorp.com/tutorials/terraform/install-cli)
*   [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

## Usage

1.  **Authenticate with Google Cloud:**

    ```
    gcloud auth application-default login
    ```

2.  **Initialize Terraform:**

    ```
    terraform init
    ```

3.  **Create a `terraform.tfvars` file:**

    Create a file named `terraform.tfvars` in this directory and add the following content:

    ```
    project_id = "your-gcp-project-id"
    iap_members = [
      "user:your-email@example.com",
    ]
    ```

4.  **Plan the deployment:**

    ```
    terraform plan -out=tfplan
    ```

5.  **Apply the deployment:**

    ```
    terraform apply "tfplan"
    ```

## Validation and Testing

After the deployment is complete, you can validate it by:

1.  **Accessing the application:** The URL of the deployed application will be displayed as an output of the `terraform apply` command.
2.  **Running the end-to-end tests:** You can run the Playwright tests to verify that the application is working correctly. You will need to update the tests to use the URL of the deployed application.
