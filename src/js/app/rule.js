var Rule = function(rule, deps) {
  this.id = Rule.id;
  this.rule = rule;
  this.deps = deps || [];

  Rule.id++;
};

Rule.id = 0;

Rule.prototype.apply = function() {
  for (var i = 0; i < this.deps.length; i++) {
    this.deps[i].apply();
  }

  this.rule();
};

module.exports = Rule;