
/*
 * GET home page.
 */
exports.status = function(req,res) {
  console.log(req.body);
}
exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};
