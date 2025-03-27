function hideTweets(users) {
    document.querySelectorAll("article").forEach(tweet => {
        users.forEach(user => {
            const userElement = tweet.querySelector(`a[href*="/${user}"]`);
            if (userElement) {
                tweet.style.display = "none"; // Hide tweet
            }
        });
    });
}

// Load stored users and hide tweets
chrome.storage.local.get(["hiddenUsers"], function (result) {
    const users = result.hiddenUsers || [];
    hideTweets(users);

    // Observe for new tweets being added
    const observer = new MutationObserver(() => hideTweets(users));
    observer.observe(document.body, { childList: true, subtree: true });
});

// Listen for updates from popup.js
chrome.runtime.onMessage.addListener((message) => {
    if (message.users) {
        hideTweets(message.users);
    }
});
