
/* 
  What we're looking for here is elements with non-native, 
  author-created shadow roots.

  ShadowRoots can be author-created on either 
  
  * the elements specifically in the allowed list 
  
  * on things parsed with valid custom element name productions. 
  
  (see https://dom.spec.whatwg.org/#dom-element-attachshadow)
  Since we are using the parsed DOM, we can simplify the second part a little 
*/

var allowed = /^(article|aside|blockquote|body|div|footer|h1|h2|h3|h4|h5|h6|header|main|nav|p|section|span)$/i

function isValidCustomElementName(el) {
    // it's got to have a dash
    if ((el.tagName.indexOf('-') !== -1) {
         // it has to be both an HTMLElement this prevents us from getting
         // any dasherized elements that could exist in 'other embdedded'
        if (el instanceof HTMLElement) {

             // finally, it actually has to be defined as a custom element
             return !(el instanceof HTMLUnknownElement)
        }
    }
    return false
}

function hasAuthorShadowRoot(el) {
    return (
        (
            isValidCustomElementName(el) 
            || 
            allowed.test(el.tagName)
        ) 
        && 
        el.shadowRoot
    )
}

return "" + Array.from(document.querySelectorAll('*'))
            .some(hasAuthorShadowRoot)
