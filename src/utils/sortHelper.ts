export const ascendingSortCriteriaByFieldName = (current:{[keyName:string]:any},next:{[keyName:string]:any},fieldToSortBy:string):number =>{
  if (current[fieldToSortBy] > next[fieldToSortBy]){
    return 1;
  } else if (current[fieldToSortBy] < next[fieldToSortBy]){
    return  -1;
  }else {
    return 0;
  }
}