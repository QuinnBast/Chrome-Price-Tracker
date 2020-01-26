chrome.runtime.onMessage.addListener((message) => {
    // Get the url
    const pageURL = window.location.href;

    if (message.action === 'addSite') {

        const trackPrice = function(clickLocation) {
            // Stop listening for clicks.
            document.removeEventListener('click', trackPrice);

            // Get the clicked element
            const domElement = event.target;

            // Determine if the clicked item has a price
            const regex = /(\d+\.\d{2})/;
            let matches = regex.exec(domElement.innerHTML);

            if (matches.length > 0) {
                // Add the item to the tracker.

                const trackedItem = {
                    title: document.title,
                    url: pageURL,
                    domSelector: getPathTo(domElement),
                    capturePrice: matches[0],
                    captureDate: new Date().toLocaleDateString(),
                    history: [{
                        date: new Date().toLocaleString(),
                        price: matches[0],
                    }],
                }

                chrome.storage.sync.get(['trackedItems'], function(result) {
                    if (result.trackedItems === undefined) {
                        result.trackedItems = [];
                    }
                    result.trackedItems.push(trackedItem);
                    chrome.storage.sync.set({"trackedItems": result.trackedItems});
                });

            }
        };

            
        // Add a listener to listen for clicks on the page.
        document.addEventListener('click', trackPrice); 
    } else if (message.action === 'goTo') {
        window.location.href = message.url;
    }

});

function getPathTo(element) {
    if (element.id!=='')
        return 'id("'+element.id+'")';
    if (element===document.body)
        return element.tagName;

    var ix= 0;
    var siblings= element.parentNode.childNodes;
    for (var i= 0; i<siblings.length; i++) {
        var sibling= siblings[i];
        if (sibling===element)
            return getPathTo(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';
        if (sibling.nodeType===1 && sibling.tagName===element.tagName)
            ix++;
    }
}