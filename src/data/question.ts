// The ballot question this testimony is about.
//
// The original repo keeps this inside a 1,400-line content module that drives a
// whole ballot page. The feed only ever needs the number and the title, for the
// modal header and the compose form, so that is all this carries.

export const QUESTION = {
  number: 5,
  title: "State Revenue Limit & Rebate",
};
