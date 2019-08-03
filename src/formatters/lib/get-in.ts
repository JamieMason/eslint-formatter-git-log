const isWalkable = (value: any) =>
  value !== null && typeof value !== 'undefined';

const getChild = (parent: any, child: any): any =>
  isWalkable(parent) ? parent[child] : undefined;

export const getIn = <T>(
  pathToValue: string | number,
  owner?: any,
  defaultValue?: T,
) => {
  const value = `${pathToValue}`.split('.').reduce(getChild, owner);
  return value !== undefined ? (value as T) : defaultValue;
};
