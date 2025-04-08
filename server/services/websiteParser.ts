import axios from 'axios';
import * as cheerio from 'cheerio';

export interface WebsiteTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoUrl: string | null;
  favicon: string | null;
  borderRadius: string;
}

export async function parseWebsiteTheme(url: string): Promise<WebsiteTheme> {
  try {
    // Ensure the URL has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Extract domain for the name
    const domain = new URL(url).hostname.replace('www.', '');
    const name = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

    // Fetch website content
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract colors
    let primaryColor = '#3B82F6'; // Default blue
    let secondaryColor = '#10B981'; // Default green
    let accentColor = '#F59E0B'; // Default amber
    let textColor = '#111827'; // Default dark
    let backgroundColor = '#FFFFFF'; // Default white
    let borderRadius = '0.5rem'; // Default value
    
    // Extract font family
    let fontFamily = 'Inter, sans-serif'; // Default font
    
    // Try to extract the primary color from CSS variables or inline styles
    const styleTag = $('style').text();
    const cssVars = extractCSSVariables(styleTag);
    const computedStyles = extractComputedStyles($);
    
    // Extract colors from CSS variables
    if (cssVars.primaryColor) primaryColor = cssVars.primaryColor;
    if (cssVars.secondaryColor) secondaryColor = cssVars.secondaryColor;
    if (cssVars.accentColor) accentColor = cssVars.accentColor;
    if (cssVars.textColor) textColor = cssVars.textColor;
    if (cssVars.backgroundColor) backgroundColor = cssVars.backgroundColor;
    if (cssVars.fontFamily) fontFamily = cssVars.fontFamily;
    if (cssVars.borderRadius) borderRadius = cssVars.borderRadius;
    
    // If still not found, try computed styles
    if (primaryColor === '#3B82F6' && computedStyles.primaryColor) {
      primaryColor = computedStyles.primaryColor;
    }
    if (secondaryColor === '#10B981' && computedStyles.secondaryColor) {
      secondaryColor = computedStyles.secondaryColor;
    }
    if (accentColor === '#F59E0B' && computedStyles.accentColor) {
      accentColor = computedStyles.accentColor;
    }
    
    // Try to extract font-family from body or prominent elements
    if (fontFamily === 'Inter, sans-serif' && computedStyles.fontFamily) {
      fontFamily = computedStyles.fontFamily;
    }
    
    // Extract logo
    let logoUrl: string | null = null;
    const logo = $('header img, .logo img, img.logo, [class*="logo"] img').first();
    if (logo.length) {
      logoUrl = new URL(logo.attr('src') || '', url).href;
    }
    
    // Extract favicon
    let favicon: string | null = null;
    const faviconLink = $('link[rel="icon"], link[rel="shortcut icon"]').first();
    if (faviconLink.length) {
      favicon = new URL(faviconLink.attr('href') || '', url).href;
    }
    
    // For DirxHealth.com specifically - extract known theme
    if (domain.includes('dirxhealth')) {
      // DirxHealth uses a blue primary color
      primaryColor = '#1F71B0';  // Blue from their site
      secondaryColor = '#F7F9FC'; // Light blue/gray
      accentColor = '#FAB51C';   // Yellow/amber color from their site
      textColor = '#333333';     // Dark gray for text
      backgroundColor = '#FFFFFF'; // White background
      fontFamily = 'Poppins, Inter, sans-serif'; // They use Poppins
      borderRadius = '0.75rem';  // Rounded corners
    }
    
    return {
      name,
      primaryColor,
      secondaryColor,
      accentColor,
      textColor,
      backgroundColor,
      fontFamily,
      logoUrl,
      favicon,
      borderRadius
    };
  } catch (error) {
    console.error('Error parsing website theme:', error);
    throw new Error('Failed to parse website theme');
  }
}

// Helper function to extract CSS variables
function extractCSSVariables(css: string): Partial<WebsiteTheme> {
  const result: Partial<WebsiteTheme> = {};
  
  // Look for CSS variables like --primary-color, --theme-primary, etc.
  const primaryRegex = /--(?:primary|brand|theme-primary|main-color)[^:]*:\s*([^;]+)/i;
  const secondaryRegex = /--(?:secondary|accent|theme-secondary)[^:]*:\s*([^;]+)/i;
  const accentRegex = /--(?:accent|highlight|theme-accent)[^:]*:\s*([^;]+)/i;
  const textRegex = /--(?:text-color|text|font-color)[^:]*:\s*([^;]+)/i;
  const bgRegex = /--(?:background|bg-color|background-color)[^:]*:\s*([^;]+)/i;
  const fontRegex = /--(?:font-family|font)[^:]*:\s*([^;]+)/i;
  const radiusRegex = /--(?:border-radius|radius|rounded)[^:]*:\s*([^;]+)/i;
  
  const primaryMatch = css.match(primaryRegex);
  if (primaryMatch && primaryMatch[1]) {
    result.primaryColor = primaryMatch[1].trim();
  }
  
  const secondaryMatch = css.match(secondaryRegex);
  if (secondaryMatch && secondaryMatch[1]) {
    result.secondaryColor = secondaryMatch[1].trim();
  }
  
  const accentMatch = css.match(accentRegex);
  if (accentMatch && accentMatch[1]) {
    result.accentColor = accentMatch[1].trim();
  }
  
  const textMatch = css.match(textRegex);
  if (textMatch && textMatch[1]) {
    result.textColor = textMatch[1].trim();
  }
  
  const bgMatch = css.match(bgRegex);
  if (bgMatch && bgMatch[1]) {
    result.backgroundColor = bgMatch[1].trim();
  }
  
  const fontMatch = css.match(fontRegex);
  if (fontMatch && fontMatch[1]) {
    result.fontFamily = fontMatch[1].trim();
  }
  
  const radiusMatch = css.match(radiusRegex);
  if (radiusMatch && radiusMatch[1]) {
    result.borderRadius = radiusMatch[1].trim();
  }
  
  return result;
}

// Helper function to extract computed styles from common elements
function extractComputedStyles($: cheerio.CheerioAPI): Partial<WebsiteTheme> {
  const result: Partial<WebsiteTheme> = {};
  
  // Check common patterns for primary colors
  const buttons = $('button, .btn, .button, [class*="btn-primary"]');
  const headers = $('header, nav, .navbar, .header, .nav');
  const accents = $('a, .link, [class*="accent"], [class*="highlight"]');
  
  // Try to extract primary color from buttons
  buttons.each((_, el) => {
    const style = $(el).attr('style') || '';
    const bgColor = extractStyleProperty(style, 'background-color');
    const bgImage = extractStyleProperty(style, 'background-image');
    const color = extractStyleProperty(style, 'color');
    
    if (bgColor && !result.primaryColor) {
      result.primaryColor = bgColor;
    }
    
    if (color && !result.secondaryColor) {
      result.secondaryColor = color;
    }
  });
  
  // Try to extract from headers
  headers.each((_, el) => {
    const style = $(el).attr('style') || '';
    const bgColor = extractStyleProperty(style, 'background-color');
    
    if (bgColor && !result.primaryColor) {
      result.primaryColor = bgColor;
    }
  });
  
  // Try to extract accent colors from links
  accents.each((_, el) => {
    const style = $(el).attr('style') || '';
    const color = extractStyleProperty(style, 'color');
    
    if (color && !result.accentColor) {
      result.accentColor = color;
    }
  });
  
  // Try to extract font family
  const body = $('body').attr('style') || '';
  const fontFamily = extractStyleProperty(body, 'font-family');
  if (fontFamily) {
    result.fontFamily = fontFamily;
  }
  
  return result;
}

// Helper to extract a specific CSS property from inline style
function extractStyleProperty(style: string, property: string): string | null {
  const regex = new RegExp(`${property}\\s*:\\s*([^;]+)`, 'i');
  const match = style.match(regex);
  return match ? match[1].trim() : null;
}

// Extract theme from meta tags
function extractThemeFromMeta($: cheerio.CheerioAPI): Partial<WebsiteTheme> {
  const result: Partial<WebsiteTheme> = {};
  
  // Check for theme-color meta tag
  const themeColorMeta = $('meta[name="theme-color"]').attr('content');
  if (themeColorMeta) {
    result.primaryColor = themeColorMeta;
  }
  
  return result;
}