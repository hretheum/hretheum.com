/*
  Validate all campaign MDX frontmatter using ZCampaignFrontmatter.
  Fails with non-zero exit code if any campaign is invalid.
  All comments/docstrings in English per policy.
*/

import { getCampaignIndex, validateCampaignFrontmatterForBrand } from '@/lib/campaigns'

async function main() {
  const errors: string[] = []
  const idx = await getCampaignIndex()
  const brands = Object.keys(idx)
  if (brands.length === 0) {
    console.log('[validate_campaigns] No campaigns found in index. OK')
    process.exit(0)
  }
  for (const brand of brands) {
    try {
      await validateCampaignFrontmatterForBrand(brand)
      console.log(`[validate_campaigns] ${brand}: OK`)
    } catch (e: any) {
      errors.push(`[${brand}] ${e?.message || e}`)
    }
  }
  if (errors.length > 0) {
    console.error('[validate_campaigns] Validation FAILED:')
    for (const err of errors) console.error(' -', err)
    process.exit(1)
  }
  console.log(`[validate_campaigns] All ${brands.length} campaign(s) valid.`)
}

main().catch((e) => {
  console.error('[validate_campaigns] Fatal error:', e)
  process.exit(1)
})
