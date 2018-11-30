const axios = require('axios');
const camelCase = require('lodash.camelcase');

module.exports = function (context, req) {
    CMS_CLIENT_ENDPOINT = process.env["CMS_CLIENT_ENDPOINT"];
    CONTENTFUL_SPACE_VALUE = process.env["CONTENTFUL_SPACE_VALUE"];
    CONTENTFUL_ACCESS_TOKEN = process.env["CONTENTFUL_ACCESS_TOKEN"];

    let newQueryParams = "";
    for (var propName in req.query) {
        newQueryParams += `&fields.${propName.replace("[]", "[in]")}=${req.query[propName]}`; 
    }

    let cms_endpoint = `${CMS_CLIENT_ENDPOINT}/spaces/${CONTENTFUL_SPACE_VALUE}/entries?access_token=${CONTENTFUL_ACCESS_TOKEN}&content_type=content_block&select=fields${newQueryParams}`;

    axios.get(cms_endpoint)
        .then(response => {
            try 
            {
                context.res = {
                    status: response.status,
                    body: cleanBody(response),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                context.done();
            }
            catch (error) { HandleError(error) };
        })
        .catch(error => HandleError(error));
};

function cleanBody(response) {
    let body;
    if (response.data.items.length == 1)
        body = { contentBlock: CleanFieldsObject(response.data.items[0]) };
    else {
        body = {
            contentBlocks: response.data.items.map(item => CleanFieldsObject(item))
        };
    }
    return body;
}

function GetEnvironmentVariable(name) {
    return name + ": " + process.env[name];
}

function CleanFieldsObject(item) {
    let newFields = {};

    for (var camel in item.fields) {
        newFields[camelCase(camel)] = item.fields[camel];
    }

    return newFields;
}

function HandleError(error) {
    console.log(error);
    context.res.status(500);
    context.done();
}
