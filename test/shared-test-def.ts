import * as GraphQL from "graphql";
import { NormMap } from "../src/norm-map";
import { Variables, RootFields } from "../src/types";

export interface SharedTestDef {
  readonly name: string;
  readonly only?: boolean;
  readonly skip?: boolean;
  readonly query: GraphQL.DocumentNode;
  readonly variables?: Variables;
  readonly data: RootFields;
  readonly normMap: NormMap;
}
