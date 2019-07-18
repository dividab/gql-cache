# graphql-norm

[![npm version][version-image]][version-url]
[![travis build][travis-image]][travis-url]
[![Coverage Status][codecov-image]][codecov-url]
[![code style: prettier][prettier-image]][prettier-url]
[![MIT license][license-image]][license-url]

Normalization and denormalization of GraphQL responses

## How to install

```
npm install graphql-norm --save
```

## Introduction

Responses from graphql servers may contain the same logical object several times. Consider for example a response from a blog server that contains a person object both as an author and a commenter. Both person objects have the same ID and are of the same GraphQL type so they are logically the same object. However, since they appear in two different parts of the response they need to be duplicated. When we want to store several GraphQL responsese the problem of duplication amplifies, as many respones may contain the same object. When we later want to update an object, it can be difficult to find all the places where the update needs to happen because there are multiple copies of the same logical object. This package solves these problems by using normalization and denormalization.

A basic description of normalization (in this context) is that it takes a tree and flattens it to a map where each object will be assigned an unique ID which is used as the key in the map. Any references that an object holds to other objects will be exhanged to an ID instead of an object reference. The process of denormalizaton goes the other way around, starting with a map and producing a tree. The [normalizr](https://www.npmjs.com/package/normalizr) library does a good job of explaining this. In fact, this package is very similar to normalizr, but it was specifically designed to work with GraphQL so it does not require hand-coded normalization schemas. Instead it uses GraphQL queries to determine how to normalize and denormalize the data.

Normalization and denormalization is useful for a number of scenarios but the main usage is probably to store and update a client-side GraphQL cache without any duplication problems. For example, [Relay](https://facebook.github.io/relay/) and [Apollo](https://www.apollographql.com/) use this approach for their caches. So the main use-case for this library is probably to build your own client-side cache where you get full control of the caching without loosing the benefit of normalization.

## Goal

The goal of the package is only to perform normalization and denormalization of graphql responses. Providing a complete caching solution is an explicit non-goal of this package. However this package can be a building block in a normalized GraphQL caching solution.

## Features

- Full GraphQL syntax support (including variables, alias, @skip, @include, etc.)
- Turn any graphql response into a flat (normalized) object map
- Build a response for any grapqhl query from the normalized object map (denormalize)
- Merge normalized object maps to build a larger map (eg. a cache)
- Optimized for run-time speed

## Example usage

```js
const appDiv: HTMLElement = document.getElementById("app");
appDiv.innerHTML = `<div>graphql-norm example, see console output</div>`;

import { normalize, denormalize, merge } from "graphql-norm";
import { request } from "graphql-request";
import { parse } from "graphql";

// A plain JS object to hold the normalized responses
let cache = {};

// This query will be fetched from the server
const query = `
{
  country(code: "SE") {
    __typename
    code
    name
    continent {
      __typename
      code
      name
    }
    languages {
      __typename
      code
      name
    }
  }
}`;
const queryDoc = parse(query);
request("https://countries.trevorblades.com/graphql", query).then(data => {
  console.log("data", JSON.stringify(data));
  /*
  {
    "country": {
      "__typename": "Country",
      "code": "SE",
      "name": "Sweden",
      "continent": {"__typename": "Continent", "code": "EU", "name": "Europe"},
      "languages": [{"__typename": "Language", "code": "sv", "name": "Swedish"}]
    }
  }
  */

  // Function to find normalized key for each object in response data
  const getKey = obj =>
    obj.code && obj.__typename && `${obj.__typename}:${obj.code}`;

  // Normalize the response data
  const normMap = normalize(queryDoc, {}, data, getKey);

  // In the normalized data, an ID was assigned to each object.
  // References between objects are now using these IDs.
  console.log("normMap", JSON.stringify(normMap));
  /*
  {
    "ROOT_QUERY": {"country({\"code\":\"SE\"})": "Country:SE"},
    "Country:SE": {
      "__typename": "Country",
      "code": "SE",
      "name": "Sweden",
      "languages": ["Language:sv"],
      "continent": "Continent:EU"
    },
    "Language:sv": {"__typename": "Language", "code": "sv", "name": "Swedish"},
    "Continent:EU": {"__typename": "Continent", "code": "EU", "name": "Europe"}
  }
*/

  // Merge the normalized response into the cache
  cache = merge(cache, normMap);

  // Now we can use denormalize to read a query from the cache
  const query2 = `
  {
    country(code: "SE") {
      __typename
      code
      name
    }
  }
  `;
  const query2Doc = parse(query2);
  const denormResult = denormalize(query2Doc, {}, cache);

  console.log("denormResult", JSON.stringify(denormResult));
  /*
  {
    "partial": false,
    "data": {"country": {"__typename": "Country", "code": "SE", "name": "Sweden"}},
    "fields": {
      "ROOT_QUERY": {},
      "Country:SE": {}
    }
  }
  */
});
```

## API

### normalize()

The normalize() function takes a GraphQL query with associated variables, and data from a GraphQL response. From those inputs it produces a normalized object map which is returned as a plain JS object. Each field in the query becomes a field in the normalized version of the object. If the field has variables they are included in the field name to make them unique. If the object has nested child objects they are exhanged for the ID of the nested object, and the nested objects becomes part of the normalized object map. This happens recursively until there are no nested objects left.

```ts
normalize(
  query: GraphQL.DocumentNode,
  variables: Variables | undefined,
  data: RootFields,
  getObjectId: GetObjectId = defaultGetObjectId
): NormMap
```

### denormalize()

The denormalize() function takes a GraphQL query with associated variables, and a normalized object map (as returned by normalize()). From those inputs it produces the data for a GraphQL JSON response. Note that the GraphQL query can be any query, it does not have to be one that was previously normalized. If the response cannot be fully created from the normalized object map then `partial` will be set to `true`.

```ts
denormalize(
  query: GraphQL.DocumentNode,
  variables: Variables | undefined,
  normMap: NormMap
): DenormalizationResult
```

### merge()

When you normalize the response of a query you probably want to merge the resulting normalized object map into a another, large normalized object map that is held by your application. Since the normalized object map is just a JS object you can do this merge any way you want but the merge() function is provided an optimized convenience to do the merging.

```ts
merge(normMap: NormMap, newNormMap: NormMap): NormMap
```

## Related packages

- [graphql-add-remove-fields](https://www.npmjs.com/package/graphql-add-remove-fields)
- [graphql-norm-patch](https://www.npmjs.com/package/graphql-norm-patch)
- [graphql-norm-stale](https://www.npmjs.com/package/graphql-norm-stale)

## How to develop

Node version >=12.6.0 is needed for development.

To execute the tests run `yarn test`.

## How to publish

```
yarn version --patch
yarn version --minor
yarn version --major
```

[version-image]: https://img.shields.io/npm/v/graphql-norm.svg?style=flat
[version-url]: https://www.npmjs.com/package/graphql-norm
[travis-image]: https://travis-ci.com/dividab/graphql-norm.svg?branch=master&style=flat
[travis-url]: https://travis-ci.com/dividab/graphql-norm
[codecov-image]: https://codecov.io/gh/dividab/graphql-norm/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/dividab/graphql-norm
[license-image]: https://img.shields.io/github/license/dividab/graphql-norm.svg?style=flat
[license-url]: https://opensource.org/licenses/MIT
[prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat
[prettier-url]: https://github.com/prettier/prettier
