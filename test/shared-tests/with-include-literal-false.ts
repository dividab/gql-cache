import gql from "graphql-tag";
import { SharedTestDef } from "../shared-test-def";

export const test: SharedTestDef = {
  name: "with skip literal true",
  query: gql`
    query TestQuery {
      posts @include(if: false) {
        id
        __typename
        author {
          id
          __typename
          name
        }
        title
        comments {
          id
          __typename
          commenter {
            id
            __typename
            name
          }
        }
      }
    }
  `,
  variables: { noPosts: true },
  data: {},
  normMap: {
    ROOT_QUERY: {}
  }
};
