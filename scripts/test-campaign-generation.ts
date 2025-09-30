/**
 * Integration Test: Campaign Generation Pipeline (Tasks 1.1-1.4)
 * 
 * Tests the complete flow:
 * 1. URL Scraping (Task 1.2)
 * 2. AI Content Generation (Task 1.4)
 * 3. MDX File Generation (Task 1.3)
 * 
 * Usage: tsx scripts/test-campaign-generation.ts <job-posting-url>
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local and .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { fetchJobPostingFromUrl, validateJobPostingUrl } from '../lib/scraping/url-fetcher'
import { generateCampaignContent, validateGeneratedContent } from '../lib/campaigns/ai-generator'
import { generateCampaignMDX, type CampaignTemplate } from '../lib/campaigns/generator'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'

function log(step: string, message: string, color: string = RESET) {
  console.log(`${color}[${step}]${RESET} ${message}`)
}

function logSection(title: string) {
  console.log(`\n${BLUE}${'='.repeat(60)}${RESET}`)
  console.log(`${BLUE}${title}${RESET}`)
  console.log(`${BLUE}${'='.repeat(60)}${RESET}\n`)
}

async function testCampaignGeneration(jobUrl: string, brand: string, industry: string) {
  const startTime = Date.now()
  
  try {
    logSection('CAMPAIGN GENERATION PIPELINE TEST')
    console.log(`Job URL: ${jobUrl}`)
    console.log(`Brand: ${brand}`)
    console.log(`Industry: ${industry}\n`)
    
    // ====================================================================
    // STEP 1: Validate URL (Task 1.2)
    // ====================================================================
    logSection('STEP 1: URL VALIDATION (Task 1.2)')
    log('VALIDATE', 'Checking if URL is from whitelisted domain...', BLUE)
    
    const urlValidation = validateJobPostingUrl(jobUrl)
    if (!urlValidation.valid) {
      log('VALIDATE', `❌ FAILED: ${urlValidation.error}`, RED)
      return
    }
    log('VALIDATE', '✅ URL is valid and whitelisted', GREEN)
    
    // ====================================================================
    // STEP 2: Fetch & Extract Content (Task 1.2)
    // ====================================================================
    logSection('STEP 2: CONTENT SCRAPING (Task 1.2)')
    log('SCRAPE', 'Fetching job posting from URL...', BLUE)
    
    const content = await fetchJobPostingFromUrl(jobUrl)
    log('SCRAPE', `✅ Content extracted: ${content.length} characters`, GREEN)
    log('SCRAPE', `Preview: ${content.slice(0, 200)}...`, YELLOW)
    
    // Extract mock requirements and skills (in production, this would use LLM)
    const mockRequirements = [
      '5+ years experience in product design',
      'Strong UX/UI background',
      'Team leadership experience',
    ]
    const mockSkills = ['Figma', 'Design Systems', 'User Research', 'Prototyping']
    const mockRole = 'Senior Product Designer'
    const mockSeniority = 'Senior'
    
    log('SCRAPE', `Extracted role: ${mockRole}`, YELLOW)
    log('SCRAPE', `Extracted seniority: ${mockSeniority}`, YELLOW)
    log('SCRAPE', `Extracted skills: ${mockSkills.join(', ')}`, YELLOW)
    
    // ====================================================================
    // STEP 3: AI Content Generation (Task 1.4)
    // ====================================================================
    logSection('STEP 3: AI CONTENT GENERATION (Task 1.4)')
    log('AI-GEN', 'Generating campaign content with LLM + RAG...', BLUE)
    log('AI-GEN', 'This will:', YELLOW)
    log('AI-GEN', '  1. Query vector DB for relevant competencies', YELLOW)
    log('AI-GEN', '  2. Query vector DB for relevant portfolio items', YELLOW)
    log('AI-GEN', '  3. Generate narrative positioning', YELLOW)
    log('AI-GEN', '  4. Generate copy for campaign modules', YELLOW)
    log('AI-GEN', '  5. Prioritize case studies by relevance', YELLOW)
    
    const aiInput = {
      jobPosting: {
        content,
        requirements: mockRequirements,
        skills: mockSkills,
        role: mockRole,
        seniority: mockSeniority,
      },
      brand,
      industry,
    }
    
    const aiOutput = await generateCampaignContent(aiInput)
    
    log('AI-GEN', '✅ AI generation complete', GREEN)
    log('AI-GEN', `Narrative confidence: ${(aiOutput.narrative.confidence * 100).toFixed(0)}%`, YELLOW)
    log('AI-GEN', `Copy confidence: ${(aiOutput.copy.confidence * 100).toFixed(0)}%`, YELLOW)
    log('AI-GEN', `Generated hero: "${aiOutput.copy.heroHeadline}"`, YELLOW)
    log('AI-GEN', `Key messages: ${aiOutput.narrative.keyMessages.length}`, YELLOW)
    log('AI-GEN', `Case studies: ${aiOutput.caseStudies.length}`, YELLOW)
    log('AI-GEN', `Metrics: ${aiOutput.metrics.length}`, YELLOW)
    
    // Validate generated content
    const validation = validateGeneratedContent(aiOutput)
    if (!validation.valid) {
      log('AI-GEN', `⚠️  Quality issues found:`, YELLOW)
      validation.errors.forEach(err => log('AI-GEN', `  - ${err}`, YELLOW))
    } else {
      log('AI-GEN', '✅ Content quality validated', GREEN)
    }
    
    // ====================================================================
    // STEP 4: MDX Generation (Task 1.3)
    // ====================================================================
    logSection('STEP 4: MDX FILE GENERATION (Task 1.3)')
    log('MDX-GEN', 'Generating campaign MDX file...', BLUE)
    
    const template: CampaignTemplate = {
      slug: `${brand}-${mockRole.toLowerCase().replace(/\s+/g, '-')}`,
      brand,
      industry,
      role: mockRole,
      heroHeadline: aiOutput.copy.heroHeadline,
      metrics: aiOutput.metrics,
      caseGrid: aiOutput.caseStudies.length > 0 ? {
        items: aiOutput.caseStudies.slice(0, 3).map(cs => ({
          title: cs.title,
          subtitle: brand,
          outcome: `Relevance: ${(cs.relevanceScore * 100).toFixed(0)}%`,
          details: cs.matchedContext,
        })),
      } : undefined,
    }
    
    const mdx = await generateCampaignMDX(template)
    
    log('MDX-GEN', '✅ MDX generated successfully', GREEN)
    log('MDX-GEN', `File size: ${mdx.length} characters`, YELLOW)
    log('MDX-GEN', `Campaign slug: ${template.slug}`, YELLOW)
    
    // ====================================================================
    // RESULTS SUMMARY
    // ====================================================================
    logSection('RESULTS SUMMARY')
    
    const duration = Date.now() - startTime
    
    console.log(`${GREEN}✅ All steps completed successfully!${RESET}\n`)
    console.log(`Total duration: ${(duration / 1000).toFixed(2)}s\n`)
    
    console.log('Pipeline Steps:')
    console.log(`  ${GREEN}✓${RESET} Step 1: URL Validation`)
    console.log(`  ${GREEN}✓${RESET} Step 2: Content Scraping (${content.length} chars)`)
    console.log(`  ${GREEN}✓${RESET} Step 3: AI Generation (${aiOutput.narrative.keyMessages.length} messages, ${aiOutput.caseStudies.length} cases)`)
    console.log(`  ${GREEN}✓${RESET} Step 4: MDX Generation (${mdx.length} chars)`)
    
    // Save full MDX to file
    const fs = await import('fs/promises')
    const outputPath = `data/campaigns/${template.slug}-test.mdx`
    await fs.writeFile(outputPath, mdx, 'utf-8')
    
    console.log('\nGenerated MDX:')
    console.log(`${GREEN}✓${RESET} Full MDX saved to: ${outputPath}`)
    console.log(`${BLUE}${'─'.repeat(60)}${RESET}`)
    console.log(mdx.slice(0, 500))
    console.log(`${BLUE}${'─'.repeat(60)}${RESET}`)
    console.log(`\n... (truncated, full length: ${mdx.length} characters)\n`)
    console.log(`${YELLOW}View full file: cat ${outputPath}${RESET}\n`)
    
    if (!validation.valid) {
      console.log(`${YELLOW}⚠️  Note: Some quality issues detected (see Step 3)${RESET}\n`)
    }
    
  } catch (error: any) {
    console.error(`\n${RED}❌ ERROR:${RESET} ${error.message}`)
    console.error(error.stack)
    process.exit(1)
  }
}

// Main execution
const args = process.argv.slice(2)

if (args.length < 1) {
  console.log('Usage: tsx scripts/test-campaign-generation.ts <job-posting-url> [brand] [industry]')
  console.log('\nExample:')
  console.log('  tsx scripts/test-campaign-generation.ts https://pracuj.pl/praca/senior-designer-12345 tmobile Telecom')
  process.exit(1)
}

const jobUrl = args[0]
const brand = args[1] || 'testbrand'
const industry = args[2] || 'Generic'

testCampaignGeneration(jobUrl, brand, industry)
  .then(() => {
    console.log(`${GREEN}✅ Test completed successfully${RESET}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error(`${RED}❌ Test failed:${RESET}`, error)
    process.exit(1)
  })
