export interface NormMap {
  readonly [key: string]: NormObj;
}

export type NormKey = string;

export type NormFieldValue =
  | NormKey
  | string
  | boolean
  | number
  | null
  | NormFieldValueArray;

export interface NormFieldValueArray extends ReadonlyArray<NormFieldValue> {}

export interface NormObj {
  readonly [field: string]: null | NormFieldValue;
}

/**
 * An optimized function to merge two maps of normalized objects (as returned from normalize)
 * @param normMap The first normalized map
 * @param newNormMap The second normalized map
 */
export function merge(normMap: NormMap, newNormMap: NormMap): NormMap {
  const updatedNormMap = Object.keys(newNormMap).reduce(
    (stateSoFar, current) => {
      const newNormObj = {
        ...(normMap[current] || {}),
        ...newNormMap[current]
      };
      stateSoFar[current] = newNormObj;
      return stateSoFar;
    },
    {} as {
      // eslint-disable-next-line functional/prefer-readonly-type
      [key: string]: any;
    }
  );

  return {
    ...normMap,
    ...updatedNormMap
  };
}
