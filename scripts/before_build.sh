#!/bin/bash
echo "Running eslint"
eslint --config ../package.json www/js/app.js

echo "Compiling Handlebars Templates"
handlebars resources/templates/*.handlebars -f www/js/compiledtemplates.js