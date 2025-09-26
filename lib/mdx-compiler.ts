// Custom MDX compiler that works with React 19 and Next.js 15
// Bypasses next-mdx-remote issues with development mode

import { compile } from '@mdx-js/mdx'
import { jsx, jsxs, Fragment } from 'react/jsx-runtime'
import { jsxDEV } from 'react/jsx-dev-runtime'
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
    const compiled = await compile(mdxContent, {
      outputFormat: 'function-body',
      development: process.env.NODE_ENV !== 'production',
      remarkPlugins: [remarkGfm],
    })
    
    // Create runtime
    const runtime = process.env.NODE_ENV !== 'production' 
      ? { jsx: jsxDEV, jsxs: jsxDEV, Fragment }
      : { jsx, jsxs, Fragment }
    
    // Build the component
    const code = String(compiled)
    
    // Execute MDX code
    const fn = new Function(
      '_jsx',
      '_jsxs', 
      'Fragment',
      '_components',
      code
    )
    
    const result = fn(
      runtime.jsx,
      runtime.jsxs,
      runtime.Fragment,
      components
    )
    
    // MDX returns an object with a default function that creates the element
    let element;
    if (result && typeof result === 'object' && 'default' in result) {
      // Call the default MDXContent function
      const MDXContent = result.default;
      element = typeof MDXContent === 'function' ? MDXContent({ components }) : MDXContent;
    } else if (typeof result === 'function') {
      // Direct function result
      element = result({ components });
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
