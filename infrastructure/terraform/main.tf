terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
  
  # Uncomment and configure for remote state management
  # backend "gcs" {
  #   bucket = "your-terraform-state-bucket"
  #   prefix = "polytokenizer/vertex-ai"
  # }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  validation {
    condition     = length(var.project_id) > 0
    error_message = "Project ID cannot be empty."
  }
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
  validation {
    condition = contains([
      "us-central1", "us-east1", "us-west1", "us-west2",
      "europe-west1", "europe-west2", "europe-west3", "europe-west4",
      "asia-east1", "asia-northeast1", "asia-southeast1"
    ], var.region)
    error_message = "Region must be a valid GCP region that supports Vertex AI."
  }
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "us-central1-a"
}

variable "service_account_name" {
  description = "Name for the Vertex AI service account"
  type        = string
  default     = "vertex-ai-embeddings"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.service_account_name))
    error_message = "Service account name must be 6-30 characters, start with a letter, and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "create_key_file" {
  description = "Whether to create and download the service account key file locally"
  type        = bool
  default     = false
}

# Data sources
data "google_project" "current" {
  project_id = var.project_id
}

# Enable required APIs
resource "google_project_service" "vertex_ai" {
  service = "aiplatform.googleapis.com"
  
  disable_dependent_services = false
  disable_on_destroy        = false
}

resource "google_project_service" "iam" {
  service = "iam.googleapis.com"
  
  disable_dependent_services = false
  disable_on_destroy        = false
}

resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
  
  disable_dependent_services = false
  disable_on_destroy        = false
}

# Create service account for Vertex AI
resource "google_service_account" "vertex_ai" {
  account_id   = var.service_account_name
  display_name = "Vertex AI Embeddings Service Account"
  description  = "Service account for Vertex AI embeddings"
  
  depends_on = [google_project_service.iam]
}

# Grant Vertex AI User role to service account
resource "google_project_iam_member" "vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.vertex_ai.email}"
}

# Create service account key
resource "google_service_account_key" "vertex_ai_key" {
  service_account_id = google_service_account.vertex_ai.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# Outputs
output "service_account_email" {
  description = "Email of the created service account"
  value       = google_service_account.vertex_ai.email
}

output "service_account_key_base64" {
  description = "Base64 encoded service account key (for environment variables)"
  value       = google_service_account_key.vertex_ai_key.private_key
  sensitive   = true
}

output "service_account_key_json" {
  description = "Service account key as JSON string (for environment variables)"
  value       = base64decode(google_service_account_key.vertex_ai_key.private_key)
  sensitive   = true
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "project_number" {
  description = "GCP Project Number"
  value       = data.google_project.current.number
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

output "vertex_ai_config" {
  description = "Configuration object for polytokenizer"
  value = {
    projectId   = var.project_id
    location    = var.region
    credentials = jsondecode(base64decode(google_service_account_key.vertex_ai_key.private_key))
  }
  sensitive = true
}

output "polytokenizer_env_vars" {
  description = "Environment variables for polytokenizer configuration"
  value = {
    VERTEX_PROJECT_ID = var.project_id
    VERTEX_LOCATION   = var.region
    VERTEX_CREDENTIALS = base64decode(google_service_account_key.vertex_ai_key.private_key)
  }
  sensitive = true
} 