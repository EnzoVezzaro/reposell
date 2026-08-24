/**
 * reposell CLI - Core developer tool for the reposell protocol
 */

export { initCommand, formatInitResult, type InitResult } from './commands/init.js';
export { licenseCommand, formatCheckResult } from './commands/license.js';
export { listingCommand, formatListingStatus, formatPaymentStatus } from './commands/listing.js';
export { listingStatus, type ListingStatus } from './app/listing-service.js';
export {
  StripePaymentProvider,
  StripeKeyMissingError,
  StripeKeyInvalidError,
  StripeApiError,
  classifySecretKey,
  type PaymentAccountStatus,
} from './domain/payment/stripe.js';
export { parseEnvFile, loadEnvSource, resolveValue } from './utils/env.js';
export { parseLicenseArgs, LicenseArgsError, type LicenseCommandArgs } from './commands/license-args.js';
export { LicenseService, type LicenseCheckResult, type LicenseUseOptions, type LicenseUseResult } from './app/license-service.js';
export { detectLicense, classifyLicenseText, parseSpdxExpression, type LicenseDetection } from './domain/license/detect.js';
export { lookupSpdx, isKnownSpdx } from './domain/license/spdx.js';
export {
  renderRslLicense,
  renderForkLicense,
  generateAiPolicy,
  renderAiPolicy,
  type RslRenderInput,
  type ForkLicenseInput,
  type AiPolicy,
} from './domain/license/templates.js';
export { BANNER_FULL, BANNER_COMPACT, renderBanner } from './cli/banner.js';
export {
  generateKeyPair,
  encodePublicKey,
  decodePublicKey,
  encodePrivateKey,
  decodePrivateKey,
  encodeSignature,
  decodeSignature,
  sign,
  verify,
  canonicalJSON,
  canonicalJSONBuffer,
  generateKeyId,
  publicKeyToPem,
  pemToPublicKey,
  privateKeyToPem,
  sha256Hex,
} from './utils/crypto.js';
export { createReposellWorkflow, generateWorkflows, renderReposellWorkflowYaml } from './workflows/ci.js';
export type {
  ReposellYml,
  ProductSection,
  PricingDeclaration,
  PaymentDeclaration,
  ReleaseDefinition,
  ReleasesSection,
  SellSection,
  MarketplaceSection,
  LicenseSection,
  ReleaseMode,
  ReleaseStatus,
} from './config/index.js';
export { validateConfig, sortedTags, CONFIG_VERSION } from './config/index.js';
export {
  ConfigNotFoundError,
  ConfigInvalidError,
  loadConfigFile,
  parseConfigText,
  renderDefaultYml,
} from './app/config-service.js';
export { buildSite, evaluateRepository, stableJson, type BuildOptions, type BuildResult } from './app/build-service.js';
export { evaluateRelease, type ReleaseEvaluation, type DeepLinkOutcome } from './app/evaluate-release.js';
export { runPublicationGates, type GateOutcome, type GateInput, type GateName } from './app/validation-service.js';
export {
  resolveSigningKey,
  createIdentity,
  signBuild,
  verifyBuildSignature,
  SigningKeyMissingError,
  SigningKeyInvalidError,
  SIGNING_KEY_ENV,
} from './app/signing-service.js';
export {
  validatePaymentLink,
  PaymentLinkMissingError,
  PaymentLinkInvalidError,
} from './domain/payment/link.js';
export {
  verifyPaymentLinkAgainstPricing,
  type DeepLinkResult,
  type DeepLinkStatus,
} from './domain/payment/stripe-links.js';
export {
  buildProtocolIndex,
  buildRepoManifest,
  buildReleaseManifest,
  buildHealthDoc,
  buildReleasesIndex,
  buildMarketplaceDoc,
  PROTOCOL_VERSION,
  SCHEMA_MANIFEST,
  SCHEMA_RELEASE,
  SCHEMA_HEALTH,
  SCHEMA_RELEASES,
  SCHEMA_MARKETPLACE,
  SCHEMA_PRICING,
  SCHEMA_SIGNATURE,
  type ProtocolIndexDoc,
  type RepoManifestDoc,
  type ReleaseManifestDoc,
  type HealthDoc,
  type HealthChecks,
  type ReleasesIndexDoc,
  type MarketplaceDoc,
  type PricingConfigDoc,
} from './domain/protocol/documents.js';
export {
  canTransition,
  evaluateAvailability,
  DRAFT,
  VALIDATING,
  PUBLISHED,
  BLOCKED,
  type ReleaseState,
  type HealthState,
} from './domain/release/state.js';
export { parseVersion, normalizeTag, compareVersions } from './domain/release/version.js';
export {
  signFileSet,
  verifyFileSet,
  renderSignatureDoc,
  type SignatureDoc,
} from './domain/signature/envelope.js';
export {
  verifyPricingEndpoint,
  splitMarketplaceFee,
  type PricingVerificationResult,
} from './domain/pricing/endpoint.js';
export {
  fetchManifest as fetchRemoteManifest,
  fetchHealth as fetchRemoteHealth,
  fetchReleases as fetchRemoteReleases,
  fetchReleasePaymentLink,
  searchRegistry,
  verifyRemoteTrust,
  pagesUrl,
  RemoteProtocolError,
} from './app/marketplace-client.js';
export type { GitInfo } from './utils/git.js';