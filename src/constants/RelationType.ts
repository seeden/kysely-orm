enum RelationType {
  BelongsToOneRelation, // when current model has exacly one related row in different table and current model is using foreign key
  HasOneRelation, // when current model has exactly one related row in different table and different table has foreign key to current model
  HasManyRelation, // when current model has many related rows in different table and different table has foreign key to current model
  BelongsToManyRelation,

  HasOneThroughRelation,
  HasManyThroughRelation,
};

export default RelationType;
