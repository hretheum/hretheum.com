// Custom MDX compiler that works with React 19 and Next.js 15
// Bypasses next-mdx-remote issues with development mode

import { compile } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import matter from 'gray-matter'
import remarkGfm from 'remark-gfm'

export async function compileMDXDirect(
  source: string,
  components: Record<string, React.ComponentType<any>>
): Promise<{ content: React.ReactElement; frontmatter: any } | null> {
  try {
    // Parse frontmatter
    const { content: mdxContent, data: frontmatter } = matter(source)
    
    // Compile MDX to JavaScript
    // Always compile in production mode to avoid _jsxDEV issues
    const compiled = await compile(mdxContent, {
      outputFormat: 'function-body',
      development: false, // Always false to use _jsx instead of _jsxDEV
      remarkPlugins: [remarkGfm],
    })
    
    // Use production runtime even in dev to avoid signature mismatch
    // jsxDEV has different signature than jsx/jsxs
    const jsxRuntime = {
      jsx: runtime.jsx,
      jsxs: runtime.jsxs,
      Fragment: runtime.Fragment
    }
    
    // Build the component
    const code = String(compiled)
    // Debug output gated by explicit env flag to avoid noisy logs
    if (process.env.NEXT_PUBLIC_MDX_DEBUG === '1') {
      console.debug('[compileMDXDirect] compiled length', code.length)
    }
    
    // MDX expects these in scope
    const fn = new Function('runtime', 'components', 'frontmatter', code)
    const result = fn(jsxRuntime, components, frontmatter)
    
    // MDX returns an object with a default function that creates the element
    let element;
    const props = { 
      components,
      frontmatter // Pass frontmatter to MDX
    };
    
    if (result && typeof result === 'object' && 'default' in result) {
      // Call the default MDXContent function
      const MDXContent = result.default;
      element = typeof MDXContent === 'function' ? MDXContent(props) : MDXContent;
    } else if (typeof result === 'function') {
      // Direct function result
      element = result(props);
    } else {
      // Already a React element
      element = result;
    }
    
    return {
      content: element as React.ReactElement,
      frontmatter
    }
  } catch (error) {
    console.error('[compileMDXDirect] Error compiling MDX:', error)
    return null
  }
}
