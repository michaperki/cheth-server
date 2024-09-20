exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.string('rollup_player_id').unique();
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('rollup_player_id');
  });
};
