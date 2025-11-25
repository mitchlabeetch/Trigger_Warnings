
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.target === 'offscreen' && request.action === 'parse-html') {
    const { htmlString } = request;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const title = extractTitle(doc);

    sendResponse({ timeline: { title } });
  }
  return true; // Indicates that the response is sent asynchronously
});

function extractTitle(doc: Document): string {
  // Try multiple selectors for Netflix title
  const titleSelectors = [
    '.video-title h4',
    '.ellipsize-text h4',
    '[data-uia="video-title"]',
    '.title-logo',
  ];

  for (const selector of titleSelectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent) {
      return element.textContent.trim();
    }
  }

  // Fallback to page title
  const pageTitle = doc.title.replace(' - Netflix', '').trim();
  if (pageTitle && pageTitle !== 'Netflix') {
    return pageTitle;
  }

  return '';
}
