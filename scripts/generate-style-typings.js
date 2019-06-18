const DtsCreator = require('typed-css-modules')
const glob = require('glob')
const path = require('path')

const creator = new DtsCreator();

glob(path.resolve(__dirname, '../clients/**/*.scss'), {}, (error, filePaths) => {
  filePaths.forEach(f => {
    console.log(f)
    creator.create(f)
      .then(content => content.writeFile())
      .catch((error) => console.log(error))
  })
});
