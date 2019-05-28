return JSON.stringify(
  Array.from(
    document
      .querySelectorAll('*'))
      .reduce((acc, el) => {
        let tag = el.tagName.toLowerCase()
        acc[tag] = (typeof acc[tag] !== 'undefined') ? acc[tag] : 0
        acc[tag]++
        return acc 
      }, {}
  )
)
