# Integrating ad networks into AMP

See also our [ad integration guidelines](../3p/README.md#ads).

## Overview
Ads are just another external resource and must play within the same constraints placed on all resources in AMP. We aim to support a large subset of existing ads with little or no changes to how the integrations work. Our long term goal is to further improve the impact of ads on the user experience through changes across the entire vertical client side stack.


## Constraints
A summary of constraints placed on external resources such as ads in AMP HTML:

- Because AMPs are served on HTTPS and ads cannot be proxied, ads must be served over HTTPS.
- The size of an ad unit must be static. It must be knowable without fetching the ad and it cannot change at runtime except through iframe resizing https://github.com/ampproject/amphtml/issues/728.
- If placing the ad requires running JavaScript (assumed to be true for 100% of ads served through networks), the ad must be placed on an origin different from the AMP document itself.
Reasons include:
  - Improved security.
  - Takes synchronous HTTP requests made by the ad out of the critical rendering path of the primary page.
  - Allows browsers to run the ad in a different process from the primary page (even better security and prevents JS inside the ad to block the main page UI thread).
  - Prevents ads doing less than optimal things to measure user behavior and other interference with the primary page.
- The AMP runtime may at any moment decide that there are too many iframes on a page and that memory is low. In that case it would unload ads that were previously loaded and are no longer visible. It may later load new ads in the same slot if the user scrolls them back into view.


## The iframe sandbox

The ad itself is hosted within a document that has an origin different from the primary page.

### Information available to the ad
We will provide the following information to the ad:

- `window.context.referrer` contains the origin of the referrer value of the primary document if available.
- `document.referrer` will typically contain the URL of the primary document. This may change in the future (See next value for a more reliable method).
- `window.context.location` contains the sanitized `Location` object of the primary document.
  This object contains keys like `href`, `origin` and other keys common for [Location](https://developer.mozilla.org/en-US/docs/Web/API/Location) objects.
  In browsers that support `location.ancestorOrigins` you can trust that the `origin` of the
  location is actually correct (So rogue pages cannot claim they represent an origin they do not actually represent).
- `window.context.canonicalUrl` contains the canonical URL of the primary document as defined by its `link rel=canonical` tag.
- `window.context.clientId` contains a unique id that is persistently the same for a given user and AMP origin site in their current browser until local data is deleted or the value expires (expiration is currently set to 1 year).
  - Ad networks must register their cid scope in the variable clientIdScope in [_config.js](./_config.js).
  - Only available on pages that load `amp-analytics`. The clientId will be null if `amp-analytics` was not loaded on the given page.
- `window.context.pageViewId` contains a relatively low entropy id that is the same for all ads shown on a page.
- [ad viewability](#ad-viewability)

More information can be provided in a similar fashion if needed (Please file an issue).

### Methods available to the ad.

- `window.context.noContentAvailable` is a function that the ad system can call if the ad slot was not filled. The container page will then react by showing placeholder content or collapsing the ad if allowed by AMP resizing rules.
- `window.context.reportRenderedEntityIdentifier` MUST be called by ads, when they know information about which creative was rendered into a particular ad frame and should contain information to allow identifying the creative. Consider including a small string identifying the ad network. This is used by AMP for reporting purposes. The value MUST NOT contain user data or personal identifiable information.

### Ad viewability

Ads can call the special API `window.context.observeIntersection(changesCallback)` to receive IntersectionObserver style [change records](http://rawgit.com/slightlyoff/IntersectionObserver/master/index.html#intersectionobserverentry) of the ad's intersection with the parent viewport.

The API allows specifying a callback that fires with change records when AMP observes that an ad becomes visible and then while it is visible, changes are reported as they happen.

Example usage:

```javascript
  window.context.observeIntersection(function(changes) {
    changes.forEach(function(c) {
      console.info('Height of intersection', c.intersectionRect.height);
    });
  });
```

`window.context.observeIntersection` returns a function which when called will stop listening for intersection messages.

Example usage:

```javascript
  var unlisten = window.context.observeIntersection(function(changes) {
    changes.forEach(function(c) {
      console.info('Height of intersection', c.intersectionRect.height);
    });
  });

  // condition to stop listening to intersection messages.
  unlisten();
```

### Ad resizing

Ads can call the special API
`window.context.requestResize(width, height)` to send a resize request.

Once the request is processed the AMP runtime will try to accommodate this request as soon as
possible, but it will take into account where the reader is currently reading, whether the scrolling
is ongoing and any other UX or performance factors.

Ads can observe wehther resize request were successful using the `window.context.onResizeSuccess` and `window.context.onResizeDenied` methods.

Example
```javascript
var unlisten = window.context.onResizeSuccess(function(requestedHeight) {
  // Hide any overflow elements that were shown.
  // The requestedHeight argument may be used to check which height change the request corresponds to.
});

var unlisten = window.context.onResizeDenied(function(requestedHeight) {
  // Show the overflow element and send a window.context.requestResize(width, height) when the overflow element is clicked.
  // You may use the requestedHeight to check which height change the request corresponds to.
});
```


Here are some factors that affect how fast the resize will be executed:

- Whether the resize is triggered by the user action;
- Whether the resize is requested for a currently active ad;
- Whether the resize is requested for an ad below the viewport or above the viewport.


### Optimizing ad performance

#### JS reuse across iframes
To allow ads to bundle HTTP requests across multiple ad units on the same page the object `window.context.master` will contain the window object of the iframe being elected master iframe for the current page. The `window.context.isMaster` property is `true` when the current frame is the master frame. 

#### Preconnect and prefetch
Add the JS URLs that an ad **always** fetches or always connects to (if you know the origin but not the path) to [_config.js](_config.js).

This triggers prefetch/preconnect when the ad is first seen, so that loads are faster when they come into view.


### Ad markup
Ads are loaded using a the <amp-ad> tag given the type of the ad network and name value pairs of configuration. This is an example for the A9 network:

```html
  <amp-ad width=300 height=250
      type="a9"
      data-aax_size="300x250"
      data-aax_pubname="test123"
      data-aax_src="302">
  </amp-ad>
```

and another for DoubleClick:

```html
  <amp-ad width=320 height=50
      type="doubleclick"
      json="{…}">
  </amp-ad>
 ````

For ad networks that support loading via a single script tag, this form is supported:

```html
  <amp-ad width=300 height=250
      type="adtech"
      src="https://adserver.adtechus.com/addyn/3.0/5280.1/2274008/0/-1/ADTECH;size=300x250;key=plumber;alias=careerbear-ros-middle1;loc=300;;target=_blank;grp=27980912;misc=3767074">
  </amp-ad>
```

Note, that the network still needs to be whitelisted and provide a prefix to valid URLs. We may add similar support for ad networks that support loading via an iframe tag.

Technically the `<amp-ad>` tag loads an iframe to a generic bootstrap URL that knows how to render the ad given the parameters to the tag.

### 1st party cookies

Access to a publishers 1st party cookies may be achieved through a custom ad bootstrap
file. See ["Running ads from a custom domain"](../builtins/amp-ad.md) in the ad documentation for details.
