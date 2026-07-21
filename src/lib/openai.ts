export interface CodeAnalysis {
  issues: string[];
  improvements: string[];
  bestPractices: string[];
  performance: string[];
  summary: string;
}

// Mock analysis that simulates Codex responses
function getMockAnalysis(code: string, language: string): CodeAnalysis {
  // Check if code contains specific patterns
  const hasLoops = code.includes('for') || code.includes('while');
  const hasRecursion = code.includes('return') && code.includes('function') && code.includes('(');
  const hasErrorHandling = code.includes('try') || code.includes('catch') || code.includes('if');
  
  const issues = [];
  const improvements = [];
  const bestPractices = [];
  const performance = [];

  // Analyze code and provide feedback
  if (!hasErrorHandling) {
    issues.push('Missing error handling - consider adding try-catch blocks');
  }
  
  if (hasRecursion) {
    issues.push('Recursion detected - ensure there is a base case to prevent stack overflow');
    performance.push('Recursive functions can be optimized using memoization or iterative approach');
  }
  
  if (hasLoops) {
    performance.push('Consider optimizing loops for better performance with large datasets');
  }
  
  if (code.includes('var')) {
    improvements.push('Use let/const instead of var for better scoping');
  }
  
  if (code.length < 100) {
    bestPractices.push('Code is concise and easy to read');
  }
  
  if (code.includes('function')) {
    bestPractices.push('Good use of functions for modularity');
    improvements.push('Add JSDoc comments to describe function parameters and return values');
  }

  // Add default feedback if nothing specific found
  if (issues.length === 0) {
    issues.push('Code looks clean - consider adding more comprehensive edge case handling');
  }
  
  if (improvements.length === 0) {
    improvements.push('Consider adding comments to explain complex logic');
  }
  
  if (bestPractices.length === 0) {
    bestPractices.push('Code follows basic coding principles');
  }
  
  if (performance.length === 0) {
    performance.push('Performance looks good - consider testing with larger data sets');
  }

  return {
    issues: issues,
    improvements: improvements,
    bestPractices: bestPractices,
    performance: performance,
    summary: `Analysis of your ${language} code. Overall, the code is functional but has room for improvement in ${issues.length > 0 ? 'error handling and optimization' : 'documentation and testing'}.`
  };
}

export async function analyzeCode(code: string, language: string): Promise<CodeAnalysis> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return getMockAnalysis(code, language);
}