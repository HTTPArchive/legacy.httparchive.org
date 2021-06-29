//[media]
// Uncomment the previous line for testing on webpagetest.org

// Sanitize the `attributes` property.
function getNodeAttributes(node) {
  // Inspired by dequelabs/axe-core.
  if (node.attributes instanceof NamedNodeMap) {
    return node.attributes;
  }
  return node.cloneNode(false).attributes;
}

// Map nodes to their attributes,
function parseNodes(nodes) {
  var parsedNodes = [];
  if (nodes) {
    for (var i = 0, len = nodes.length; i < len; i++) {
      var node = nodes[i];
      var attributes = Object.values(getNodeAttributes(node));
      var el = {};

      el.tagName = node.tagName.toLowerCase(); // for reference
      for (var n = 0, len2 = attributes.length; n < len2; n++) {
        var attribute = attributes[n];
        el[attribute.name.toLowerCase()] = attribute.value;
      }

      parsedNodes.push(el);
    }
  }
  return parsedNodes;
}

// Return the set of attributes for nodes,
function getNodesAttributes(nodes) {
  if (!nodes) {
    return [];
  }
  var uniqueAttributes = new Set();
  for (var node of nodes) {
    var attributes = Object.values(getNodeAttributes(node));
    for (var attribute of attributes) {
      uniqueAttributes.add(attribute.name.toLowerCase());
    }
  }
  return Array.from(uniqueAttributes);
}

return JSON.stringify({
  // Counts the number of picture tags containing an img tag
  'num_picture_img': document.querySelectorAll('picture img').length,
  // Counts the number of source or img tags with sizes attribute
  'num_image_sizes': document.querySelectorAll('source[sizes], img[sizes]').length,
  // Count the mumber of images with srcset attribute
  'num_srcset_all': document.querySelectorAll('source[srcset], img[srcset]').length,
  // Count the mumber of images with srcset and sizes attributes
  'num_srcset_sizes': document.querySelectorAll('source[srcset][sizes], img[srcset][sizes]').length,
  // Count the number of imges with srcset with descriptor-x
  'num_srcset_descriptor_x': (() => {
    var nodes = document.querySelectorAll('source[srcset], img[srcset]');
    return Array.from(nodes).filter(node => node.getAttribute('srcset').match(/\s\d+x/)).length;
  })(),
  // Count the number of imges with srcset with descriptor-w
  'num_srcset_descriptor_w': (() => {
    var nodes = document.querySelectorAll('source[srcset], img[srcset]');
    return Array.from(nodes).filter(node => node.getAttribute('srcset').match(/\s\d+w/)).length;
  })(),
  // Count the number of scrset candidates
  'num_srcset_candidates': (() => {
    var nodes = document.querySelectorAll('source[srcset], img[srcset]');
    var count = 0;
    for (var i = 0, len = nodes.length; i < len; i++) {
      var srcset = nodes[i].getAttribute('srcset');
      if (!srcset) {
        continue;
      }
      count += srcset.split(',').length;
    }
    return count;
  })(),
  // Return picture formats ["image/webp","image/svg+xml"]
  'picture_formats': (() => {
    var nodes = document.querySelectorAll('picture source[type]');
    var formats = new Set();
    for (var source of nodes) {
      var format = source.getAttribute('type');
      if (!format) {
        continue;
      }
      formats.add(format.toLowerCase());
    }
    return Array.from(formats);
  })(),
  // Count all video nodes
  'num_video_nodes': document.querySelectorAll('video').length,

  //gets the duration of all videos
  'video_durations': (() =>{
    return Array.from(document.querySelectorAll('video')).map(video => video.duration);
  })(),

    // Returns a set of video node attribute names, and the count on the page
    'video_attributes_values_counts': Array.from(document.querySelectorAll('video')).reduce((stats, video) => {
      const attrs = video.getAttributeNames();
      var filter = ['autoplay', 'autoPictureInPicture', 'buffered', 'controls',
      'controlslist', 'crossorigin', 'use-credentials', 'currentTime',
      'disablePictureInPicture', 'disableRemotePlayback', 'duration',
      'height', 'intrinsicsize', 'loop', 'muted', 'playsinline', 'poster',
      'preload', 'src', 'width'];
      attrs.map(attr => attr.toLowerCase()).filter(attr => filter.includes(attr)).forEach(attr => {
        const value = video.getAttribute(attr);
        let stat = stats.find(stat => stat.attribute == attr && stat.value == value);
        if (!stat) {
          stat = {attribute: attr, value, count: 0};
          stats.push(stat);
        }
        stat.count++;
      });
      return stats;
    }, []),
    //Returns the CSS display style for a video tag
    //many mobile sites use display:none to 'hide' the video, but it still gets downloaded
    'video_display_style' : Array.from(document.querySelectorAll('video')).map(video => {
      return getComputedStyle(video, null).getPropertyValue('display');
    }),
    //returns an array of the number of source files per video tag.
    'video_source_format_count': Array.from(document.querySelectorAll('video')).map(video => video.querySelectorAll('source').length),
    //Returns all of the video types for each source file 
    'video_source_format_type': Array.from(document.querySelectorAll('video')).map(video => {
      return Array.from(video.querySelectorAll('source')).map(source => {
        return source.getAttribute('type')
      });
    }),
  // Counts the number of pictures using source media min-resolution
  'num_picture_using_min_resolution': (() => {
    var pictures = document.querySelectorAll('picture');
    return Array.from(pictures).filter(picture => {
      return picture.querySelector('source[media*="min-resolution"]');
    }).length;
  })(),
  // Counts the number of pictures using source media orientation
  'num_picture_using_orientation': (() => {
    var pictures = document.querySelectorAll('picture');
    return Array.from(pictures).filter(picture => {
      return picture.querySelector('source[media*="orientation"]');
    }).length;
  })(),
  // Counts the number of candidates for srcset of img that are not in picture
  'num_img_not_in_picture_srcset_candidates': (() => {
    var images = document.querySelectorAll('img[srcset]');
    var nodes = Array.from(images).filter(image => {
      return image.parentNode.tagName.toLowerCase() != 'picture';
    });
    var count = 0;
    for (var node of nodes) {
      var srcset = node.getAttribute('srcset');
      if (!srcset) {
        continue;
      }
      count += srcset.split(',').length;
    }
    return count;
  })()
});
