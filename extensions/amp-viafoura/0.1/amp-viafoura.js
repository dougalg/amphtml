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
    const limit = this.element.getAttribute("data-limit");
    const sort = this.element.getAttribute("data-sort");
    const path = this.element.getAttribute("data-path");
    const title = this.element.getAttribute("data-title");
    const unique_id = this.element.getAttribute("data-unique-id");
    const width = this.element.getAttribute('width');
    const height = this.element.getAttribute('height');

    const iframe = document.createElement('iframe');
    iframe.setAttribute('frameborder', '0');
    iframe.src = 'https://vine.co/v/' +
      encodeURIComponent(vineid) + '/embed/simple';

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
