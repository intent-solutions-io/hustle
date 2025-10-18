#!/bin/bash
# migrate-docs-flat.sh
# SINGLE FLAT /docs/ - NO SUBDIRECTORIES EVER

set -e

echo "========================================"
echo "FLAT /docs/ Migration"
echo "DOCUMENT-FILING-SYSTEM-STANDARD-v2.0"
echo "========================================"
echo ""

# Create ONLY flat directories
mkdir -p docs
mkdir -p security/credentials

echo "✅ Created flat directories"
echo ""

# Migrate files 001-010
cp "001-claude-docs/001-prd-hustle-mvp-v1.md" "docs/001-PP-PROD-hustle-mvp-v1.md"
cp "001-claude-docs/002-prd-hustle-mvp-v2-lean.md" "docs/002-PP-PROD-hustle-mvp-v2-lean.md"
cp "001-claude-docs/003-pln-sales-strategy.md" "docs/003-PP-PLAN-sales-strategy.md"
cp "001-claude-docs/004-log-infrastructure-setup.md" "docs/004-LS-LOGS-infrastructure-setup.md"
cp "001-claude-docs/005-log-infrastructure-complete.md" "docs/005-LS-LOGS-infrastructure-complete.md"
cp "001-claude-docs/006-log-billing-quota-fix.md" "docs/006-LS-LOGS-billing-quota-fix.md"
cp "001-claude-docs/007-log-initial-setup-status.md" "docs/007-LS-STAT-initial-setup-status.md"
cp "001-claude-docs/008-log-pre-deployment-status.md" "docs/008-LS-STAT-pre-deployment-status.md"
cp "001-claude-docs/009-log-nextjs-init.md" "docs/009-LS-LOGS-nextjs-init.md"
cp "001-claude-docs/010-log-cloud-run-deployment.md" "docs/010-OD-DEPL-cloud-run-deployment.md"
echo "✅ 001-010 migrated"

# Migrate files 011-020
cp "001-claude-docs/011-log-gate-a-milestone.md" "docs/011-LS-CHKP-gate-a-milestone.md"
cp "001-claude-docs/012-log-game-logging-verification.md" "docs/012-TQ-TEST-game-logging-verification.md"
cp "001-claude-docs/013-ref-claudes-docs-archive.md" "docs/013-DR-REFF-claudes-docs-archive.md"
cp "001-claude-docs/014-ref-deployment-index.md" "docs/014-DR-REFF-deployment-index.md"
cp "001-claude-docs/015-adr-nextauth-migration.md" "docs/015-AT-ADEC-nextauth-migration.md"
cp "001-claude-docs/016-ref-dashboard-template-diagram.md" "docs/016-AT-DIAG-dashboard-template-diagram.md"
cp "001-claude-docs/017-ref-devops-system-analysis.md" "docs/017-RA-ANLY-devops-system-analysis.md"
cp "001-claude-docs/018-ref-devops-guide.md" "docs/018-DR-GUID-devops-guide.md"
cp "001-claude-docs/019-ref-app-readme.md" "docs/019-DR-REFF-app-readme.md"
cp "001-claude-docs/020-ref-directory-standards.md" "docs/020-DR-REFF-directory-standards.md"
echo "✅ 011-020 migrated"

# Migrate files 021-030
cp "001-claude-docs/021-bug-auth-404-analysis.md" "docs/021-TQ-BUGR-auth-404-analysis.md"
cp "001-claude-docs/022-fix-landing-page-links.md" "docs/022-DC-CODE-landing-page-links-fix.md"
cp "001-claude-docs/023-fix-registration-api.md" "docs/023-DC-CODE-registration-api-fix.md"
cp "001-claude-docs/024-aar-auth-404-fix.md" "docs/024-AA-AACR-auth-404-fix.md"
cp "001-claude-docs/025-test-verification-guide.md" "docs/025-TQ-TEST-verification-guide.md"
cp "001-claude-docs/026-fix-add-athlete-flow.md" "docs/026-DC-CODE-add-athlete-flow-fix.md"
cp "001-claude-docs/027-sec-nextauth-migration-complete.md" "docs/027-TQ-SECU-nextauth-migration-complete.md"
cp "001-claude-docs/028-aar-complete-nextauth-security-fix.md" "docs/028-AA-AACR-nextauth-security-fix.md"
cp "001-claude-docs/029-srv-parent-survey.md" "docs/029-UC-SURV-parent-survey.md"
cp "001-claude-docs/030-bug-auth-404-root-cause.md" "docs/030-TQ-BUGR-auth-404-root-cause.md"
echo "✅ 021-030 migrated"

# Migrate files 031-040
cp "001-claude-docs/031-bug-auth-404-fix-details.md" "docs/031-TQ-BUGR-auth-404-fix-details.md"
cp "001-claude-docs/032-bug-landing-page-fix.patch" "docs/032-TQ-BUGR-landing-page-fix.patch"
cp "001-claude-docs/037-pln-product-roadmap.md" "docs/033-PP-RMAP-product-roadmap.md"
cp "001-claude-docs/038-adr-system-architecture.md" "docs/034-AT-ADEC-system-architecture.md"
cp "001-claude-docs/039-pol-contribution-guide.md" "docs/035-BL-POLI-contribution-guide.md"
cp "001-claude-docs/040-athletes-list-typescript-improvements.md" "docs/036-DC-DEVN-athletes-list-typescript.md"
cp "001-claude-docs/040-ref-version-management.md" "docs/037-DR-REFF-version-management.md"
cp "001-claude-docs/041-sop-release-process.md" "docs/038-DR-SOPS-release-process.md"
cp "001-claude-docs/042-ref-github-pages-index.md" "docs/039-DR-REFF-github-pages-index.md"
cp "001-claude-docs/043-ref-jekyll-config.yml" "docs/040-OD-CONF-jekyll-config.yml"
echo "✅ 031-040 migrated"

# Migrate files 041-050
cp "001-claude-docs/044-dep-hustle-gcp-deployment.md" "docs/041-OD-DEPL-hustle-gcp-deployment.md"
cp "001-claude-docs/045-query-optimization-summary.md" "docs/042-RA-ANLY-query-optimization-summary.md"
cp "001-claude-docs/045-query-performance-analysis.md" "docs/043-RA-ANLY-query-performance-analysis.md"
cp "001-claude-docs/045-ref-authentication-system.md" "docs/044-DR-REFF-authentication-system.md"
cp "001-claude-docs/045-sop-github-actions-deployment.md" "docs/045-DR-SOPS-github-actions-deployment.md"
cp "001-claude-docs/046-note-github-actions-limitation.md" "docs/046-MS-MISC-github-actions-limitation.md"
cp "001-claude-docs/046-optimization-playbook.md" "docs/047-DR-GUID-optimization-playbook.md"
cp "001-claude-docs/046-sop-resend-setup.md" "docs/048-DR-SOPS-resend-setup.md"
cp "001-claude-docs/047-ref-devops-deployment-guide.md" "docs/049-DR-GUID-devops-deployment-guide.md"
cp "001-claude-docs/048-ref-devops-architecture.md" "docs/050-AT-ARCH-devops-architecture.md"
echo "✅ 041-050 migrated"

# Migrate files 051-060
cp "001-claude-docs/049-ref-devops-operations.md" "docs/051-DR-REFF-devops-operations.md"
cp "001-claude-docs/050-ref-architecture-competitive-advantage.md" "docs/052-AT-ARCH-competitive-advantage.md"
cp "001-claude-docs/050-task-typescript-type-safety-report.md" "docs/053-PM-TASK-typescript-type-safety.md"
cp "001-claude-docs/051-ana-user-journey-current-state.md" "docs/054-RA-ANLY-user-journey-current-state.md"
cp "001-claude-docs/051-db-athlete-detail-query-optimization.md" "docs/055-RA-ANLY-athlete-query-optimization.md"
cp "001-claude-docs/051-migration-composite-index.sql" "docs/056-DD-SQLS-migration-composite-index.sql"
cp "001-claude-docs/051-optimized-query-example.tsx" "docs/057-DC-CODE-optimized-query-example.tsx"
cp "001-claude-docs/051-schema-update-recommendation.prisma" "docs/058-DD-SQLS-schema-update.prisma"
cp "001-claude-docs/051-task-summary.md" "docs/059-PM-TASK-task-summary.md"
cp "001-claude-docs/051-visual-performance-comparison.md" "docs/060-RA-ANLY-performance-visual.md"
echo "✅ 051-060 migrated"

# Migrate files 061-070
cp "001-claude-docs/052-cto-agent-orchestration-plan.md" "docs/061-PP-PLAN-agent-orchestration.md"
cp "001-claude-docs/053-des-athletes-list-dashboard-ux.md" "docs/062-AT-DSGN-athletes-dashboard-ux.md"
cp "001-claude-docs/054-ref-error-tracking-setup.md" "docs/063-DR-REFF-error-tracking-setup.md"
cp "001-claude-docs/055-sum-phase-9-monitoring-complete.md" "docs/064-MC-SUMM-phase-9-monitoring.md"
cp "001-claude-docs/056-ver-gcloud-monitoring-activated.md" "docs/065-TQ-TEST-gcloud-monitoring-verified.md"
cp "001-claude-docs/057-sta-phase-9-complete-status.md" "docs/066-LS-STAT-phase-9-complete.md"
cp "001-claude-docs/058-action-items-summary.md" "docs/067-MC-ACTN-action-items-summary.md"
cp "001-claude-docs/058-exact-code-fixes.md" "docs/068-DC-CODE-exact-code-fixes.md"
cp "001-claude-docs/058-final-review-game-logging-form.md" "docs/069-RA-REVW-game-logging-form.md"
cp "001-claude-docs/059-ref-athlete-detail-implementation-notes.md" "docs/070-DC-DEVN-athlete-detail-notes.md"
echo "✅ 061-070 migrated"

# Migrate files 071-080
cp "001-claude-docs/060-sum-build-completion.md" "docs/071-MC-SUMM-build-completion.md"
cp "001-claude-docs/061-rev-task-52-athlete-detail.md" "docs/072-RA-REVW-task-52-athlete-detail.md"
cp "001-claude-docs/062-chk-deployment.md" "docs/073-TQ-TEST-deployment-check.md"
cp "001-claude-docs/063-ref-game-logging-form-implementation.md" "docs/074-DC-DEVN-game-logging-implementation.md"
cp "001-claude-docs/064-ref-jeremy-devops-guide.md" "docs/075-DR-GUID-jeremy-devops-guide.md"
cp "001-claude-docs/065-ref-migration-guide.md" "docs/076-DR-GUID-migration-guide.md"
cp "001-claude-docs/066-sum-mvp-completion-2025-10-09.md" "docs/077-MC-SUMM-mvp-completion-oct-9.md"
cp "001-claude-docs/067-sum-mvp-status-2025-10-16.md" "docs/078-LS-STAT-mvp-status-oct-16.md"
cp "001-claude-docs/068-sum-phase-6b-security-defensive-stats.md" "docs/079-MC-SUMM-phase-6b-security.md"
cp "001-claude-docs/069-ref-query-execution-flow.md" "docs/080-DR-REFF-query-execution-flow.md"
echo "✅ 071-080 migrated"

# Migrate files 081-090
cp "001-claude-docs/070-pln-security-fixes-action-2025-10-09.md" "docs/081-PP-PLAN-security-fixes-oct-9.md"
cp "001-claude-docs/071-sum-security-review-executive-2025-10-09.md" "docs/082-MC-SUMM-security-review-oct-9.md"
cp "001-claude-docs/072-rev-security-game-logging-2025-10-09.md" "docs/083-RA-REVW-security-game-logging.md"
cp "001-claude-docs/073-ana-task-41-athletes-query-performance.md" "docs/084-RA-ANLY-task-41-query-perf.md"
cp "001-claude-docs/074-chk-task-41-deployment.md" "docs/085-TQ-TEST-task-41-deployment.md"
cp "001-claude-docs/075-ref-task-41-migration-instructions.md" "docs/086-DR-GUID-task-41-migration.md"
cp "001-claude-docs/076-sum-task-41-optimization.md" "docs/087-MC-SUMM-task-41-optimization.md"
cp "001-claude-docs/077-ref-task-41-readme.md" "docs/088-DR-REFF-task-41-readme.md"
cp "001-claude-docs/078-ref-task-41-visual-summary.md" "docs/089-DR-REFF-task-41-visual-summary.md"
cp "001-claude-docs/079-ref-task-44-dashboard-real-data.md" "docs/090-DR-REFF-task-44-dashboard-data.md"
echo "✅ 081-090 migrated"

# Migrate files 091-096
cp "001-claude-docs/080-ref-user-journey-guide.md" "docs/091-DR-GUID-user-journey-guide.md"
cp "001-claude-docs/081-chk-domain-verification-steps.md" "docs/092-OD-OPNS-domain-verification.md"
cp "001-claude-docs/081-ref-hustlestats-domain-settings.md" "docs/093-OD-CONF-hustlestats-domain.md"
cp "001-claude-docs/082-chk-dns-records-update.md" "docs/094-OD-OPNS-dns-records-update.md"
cp "001-claude-docs/082-ref-hustlestats-CORRECTED-dns-records.md" "docs/095-OD-CONF-dns-records-corrected.md"
cp "001-claude-docs/083-ref-www-subdomain-dns.md" "docs/096-OD-CONF-www-subdomain-dns.md"
echo "✅ 091-096 migrated"

# Migrate survey-remediation (FLATTEN into docs/)
cp "001-claude-docs/survey-remediation/FINAL-SURVEY-REMEDIATION-REPORT.md" "docs/097-RA-REPT-survey-remediation.md"
cp "001-claude-docs/survey-remediation/issue-001-root-cause-analysis.md" "docs/098-RA-RCAS-survey-issue-root-cause.md"
echo "✅ Survey files flattened into docs/"

# Migrate root files
cp ".directory-standards.md" "docs/099-DR-REFF-directory-standards-legacy.md"
echo "✅ Root file migrated"

# Migrate .github release files (FLATTEN into docs/)
cp ".github/RELEASE_NOTES_v00.00.01.md" "docs/100-OD-RELS-release-notes-v00-00-01.md"
cp ".github/releases/v00.00.01/changelog.md" "docs/101-OD-CHNG-changelog-v00-00-01.md"
cp ".github/releases/v00.00.01/release-notes.md" "docs/102-OD-RELS-release-notes-detailed.md"
echo "✅ Release files flattened into docs/"

# Move security files
if [ -f ".credentials/hustle-monitoring-key.json" ]; then
  cp ".credentials/hustle-monitoring-key.json" "security/credentials/hustle-monitoring-key.json"
  echo "🔒 Security file copied"
fi

echo ""
echo "========================================"
echo "✅ Migration Complete!"
echo "========================================"
echo ""
echo "📊 Files in /docs/:"
ls docs/ | wc -l
echo ""
echo "📁 Subdirectories in /docs/ (should be 0):"
find docs -mindepth 1 -type d | wc -l
echo ""
echo "🔍 Sample files:"
ls docs/ | head -5
echo "..."
ls docs/ | tail -5
echo ""
