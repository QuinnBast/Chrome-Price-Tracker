function saveStorage() {
    // query the current tabs for the active tab:
    const queryOptions = {
        active: true,
        currentWindow: true,
    };

    document.getElementById("contentContainer").innerHTML = "<h2>Click on the price of the item you would like to track!</h2>";

    chrome.tabs.query(queryOptions, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'addSite'});
    });
};

function goToUrl(location) {
    // query the current tabs for the active tab:
    const queryOptions = {
        active: true,
        currentWindow: true,
    };

    chrome.tabs.query(queryOptions, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'goTo', url: location});
    });
}

function getStorage() {
    chrome.storage.sync.get(['trackedItems'], function(result) {

        // Create some HTML to display your tracked items.
        let tableRows = "";
        console.log(result);
        if(result.trackedItems === undefined && result.trackedItems.length > 0) {
            return;
        }
        for(const trackedItem of result.trackedItems) {
            tableRows += `<tr>
            <td>${trackedItem.title}</td>
            <td><a href="#" id="${trackedItem.url}">${extractHostname(trackedItem.url)}</a></td>
            <td>${trackedItem.capturePrice}</td>
            <td>${trackedItem.history[trackedItem.history.length - 1].price}</td>            
            <td>${trackedItem.history[trackedItem.history.length - 1].date}</td>            
            <td>${trackedItem.captureDate}</td>
            </tr>`
        }
        const html = `
        <table style="border: 1px solid black"><thead style="border: 1px solid black">
        <th>Name</th>
        <th>URL</th>
        <th>Capture Price</th>
        <th>Current Price</th>
        <th>Last Updated</th>
        <th>Date Added</th>
        </thead>
        <tbody>
        ${tableRows}
        </tbody>
        </table>
        `

        document.getElementById("yourItems").innerHTML = html;
        
        for(const trackedItem of result.trackedItems) {
            document.getElementById(trackedItem.url).addEventListener('click', function() {
                goToUrl(trackedItem.url);
            });
        }
    })
};

function registerListeners() {
    document.getElementById("submitButton").addEventListener("click", saveStorage);
    getStorage();
};

function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];
    //find & remove www.
    hostname = hostname.split('.')[1];
    //find&remove .com etc.
    if (hostname.indexOf('.') > -1) {
        hostname = hostname.split('.')[0];
    }

    return hostname;
}

function checkPrices() {
    chrome.storage.sync.get(['trackedItems'], function(result) {

        result.trackedItems.forEach(
            (trackedItem) => {
                const lastUpdateDate = new Date(trackedItem.history[trackedItem.history.length -1].date);
                const today = new Date();
    
                // If we have checked the price today already, do not check again.
                /*
                if(lastUpdateDate.getDate() === today.getDate() &&
                    lastUpdateDate.getMonth() === today.getMonth() &&
                    lastUpdateDate.getFullYear() == today.getFullYear())
                {
                        // Early exit
                        return;
                }
                */
    
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.onreadystatechange = function() { 
                    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                        var doc = new DOMParser().parseFromString(xmlHttp.responseText, "text/html");
    
                        console.log(xmlHttp.responseText);
                        console.log(doc);
    
                        // Check the div item of the response
                        const domNode = doc.evaluate(trackedItem.domSelector, doc, null, XPathResult.STRING_TYPE, null);
                        console.log(domNode);
                        if (domNode !== undefined && domNode !== null) {
    
                            let price = domNode.stringValue;
    
                            // Get the price from the text:
                            const regex = /(\d+\.\d{2})/;
                            let matches = regex.exec(domNode.stringValue);
    
                            if(matches !== null && matches.length > 0) {
                                price = matches[0];
                            }
    
                            trackedItem.history.push({
                                date: new Date().toLocaleString(),
                                price: price,
                            });
    
                            console.log(trackedItem);
                            
                            chrome.storage.sync.set({"trackedItems": result.trackedItems});
                        }
                    }
                }
                xmlHttp.open("GET", trackedItem.url, true); // true for asynchronous 
                xmlHttp.send(null);
            },
        );
    });
}

window.onload = registerListeners;
checkPrices();