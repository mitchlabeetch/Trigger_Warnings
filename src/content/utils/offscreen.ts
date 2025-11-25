const OFFSCREEN_DOCUMENT_PATH = '/offscreen/processor.html';

let creating: Promise<void> | null; // A global promise to avoid concurrency issues

// This function will create an offscreen document if one doesn't exist yet.
async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // If we're already creating an offscreen document, wait for it to finish.
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['DOM_PARSER'],
      justification: 'To safely parse HTML strings without affecting the content script'
    });
    await creating;
    creating = null;
  }
}

// This function will send a message to the offscreen document and return a promise that resolves with the response.
export async function sendHtmlToOffscreen(htmlString: string): Promise<any> {
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

  const response = await chrome.runtime.sendMessage({
    action: 'parse-html',
    htmlString,
    target: 'offscreen'
  });

  return response;
}
