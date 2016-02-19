/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {isLayoutSizeDefined} from '../../../src/layout';
import {loadPromise} from '../../../src/event-helper';

// const FRAME_SRC = 'https://viafoura.io/';
const FRAME_SRC = 'https://192.168.120.131:8001/amp-widget.html';

// TODO: extend AMP.iframe somehow?
class AmpViafoura extends AMP.BaseElement {

  /** @override */
  preconnectCallback(onLayout) {
    // The viafoura iframe
    this.preconnect.url('https://???.viafoura.com', onLayout);
    // The Viafoura api
    this.preconnect.url('https://api.viafoura.com', onLayout);
    // Viafoura assets loaded in the iframe
    this.preconnect.url('https://cdn.viafoura.net', onLayout);
  }

  /** @override */
  isLayoutSupported(layout) {
    return isLayoutSizeDefined(layout);
  }

  /** @override */
  layoutCallback() {
    const getAttr = attr => encodeURIComponent(this.element.getAttribute(attr));
    const widget = getAttr("data-widget");
    const limit = getAttr("data-limit");
    const sort = getAttr("data-sort");
    const path = getAttr("data-path");
    const title = getAttr("data-title");
    const unique_id = getAttr("data-unique-id");

    const width = this.element.getAttribute('width');
    const height = this.element.getAttribute('height');

    const iframe = document.createElement('iframe');
    iframe.setAttribute('frameborder', '0');
    iframe.src = `${FRAME_SRC}?limit=${limit}&sort=${sort}&path=${path}&title=`+
        `${title}&unique_id=${unique_id}&widget=${widget}`;

    this.applyFillContent(iframe);

    iframe.width = width;
    iframe.height = height;
    this.element.appendChild(iframe);

    /** @private {?Element} */
    this.iframe_ = iframe;

    return loadPromise(iframe);
  }

  /** @override */
  documentInactiveCallback() {
    if (this.iframe_ && this.iframe_.contentWindow) {
      this.iframe_.contentWindow./*OK*/postMessage('pause', '*');
    }

    // No need to do layout later - user action will be expect to resume
    // the playback
    return false;
  }
}

AMP.registerElement('amp-viafoura', AmpViafoura);
