document.addEventListener("DOMContentLoaded", function () {
    const usernameInput = document.getElementById("username");
    const addUserBtn = document.getElementById("addUser");
    const userList = document.getElementById("userList");
    const exportBtn = document.getElementById("export");
    const importInput = document.getElementById("import");

    chrome.storage.local.get(["hiddenUsers"], function (result) {
        const users = result.hiddenUsers || [];
        users.forEach(addUserToList);
    });

    addUserBtn.addEventListener("click", function () {
        const username = usernameInput.value.trim();
        if (!username) return;

        chrome.storage.local.get(["hiddenUsers"], function (result) {
            let users = result.hiddenUsers || [];

            // Prevent duplicates
            if (!users.includes(username)) {
                users.push(username);
                chrome.storage.local.set({ hiddenUsers: users }, function () {
                    addUserToList(username);
                    notifyContentScript(); // Notify content script after adding
                });
            }
        });
    });


    function removeUser(username) {
        chrome.storage.local.get(["hiddenUsers"], function (result) {
            let users = result.hiddenUsers || [];
            users = users.filter(user => user !== username);
            chrome.storage.local.set({ hiddenUsers: users }, function () {
                document.querySelector(`li[data-user="${username}"]`).remove();
                notifyContentScript();
            });
        });
    }

    function addUserToList(username) {
        const li = document.createElement("li");
        li.setAttribute("data-user", username);
        
        const text = document.createElement("span");
        text.textContent = username;
        li.appendChild(text);

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.className = "remove";
        removeBtn.addEventListener("click", () => removeUser(username));
        
        li.appendChild(removeBtn);
        userList.appendChild(li);
    }

    function notifyContentScript() {
        chrome.storage.local.get(["hiddenUsers"], function (result) {
            chrome.runtime.sendMessage({ users: result.hiddenUsers || [] });
        });
    }

    exportBtn.addEventListener("click", function () {
        chrome.storage.local.get(["hiddenUsers"], function (result) {
            const blob = new Blob([JSON.stringify(result.hiddenUsers || [])], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "hidden_users.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    });

    importInput.addEventListener("change", function () {
        const file = importInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const importedUsers = JSON.parse(event.target.result);
                if (Array.isArray(importedUsers)) {
                    chrome.storage.local.set({ hiddenUsers: importedUsers }, function () {
                        userList.innerHTML = "";
                        importedUsers.forEach(addUserToList);
                        notifyContentScript();
                    });
                }
            } catch (e) {
                console.error("Invalid JSON file");
            }
        };
        reader.readAsText(file);
    });
});
