export default defineBackground({
  type: 'module',
  include: ['chrome'],
  main: () => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        "id": "truecaller",
        "title": "Truecaller Search",
        "contexts": ["selection", "link"]
      });
    });

    chrome.contextMenus.onClicked.addListener((clickData, tab) => {
      if (clickData.menuItemId != "truecaller" || !clickData.selectionText && !clickData.linkUrl) return;

      chrome.storage.session.set({ number: clickData.selectionText || clickData.linkUrl });
      chrome.sidePanel.open({ tabId: tab?.id! }).catch(console.error);
    });
  }
});
