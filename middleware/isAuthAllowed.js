module.exports = (allowedRolesArr1) => {
  // console.log(66);
  return (req, res, next) => {
    // console.log(allowedRolesArr1);
    const allowedRolesArr = allowedRolesArr1;

    if (!allowedRolesArr.length) {
      return res.status(401).json({
        message: "No Roles"
      });
    }

    if (!req.userData) {
      return res.status(401).json({
        message: "No Auth"
      });
    }

    let isAllowed = false;

    if (!!allowedRolesArr.length) {
      const checkArr = allowedRolesArr.map((item) => {
        // console.log(`${req?.userData?.type} === ${item}`);
        if (req?.userData?.type == item) {
          isAllowed = true;
          return true;
        }
        return false;
      });
      // console.log(checkArr);
    }

    if (!isAllowed) {
      return res.status(401).json({
        message: "You don't have permission"
      });
    }

    next();
  };
};
