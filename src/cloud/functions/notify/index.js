const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * Send a WeChat subscription message.
 *
 * @param {Object} event
 * @param {string} event.toOpenId   - recipient's openId
 * @param {string} event.templateId - subscription message template ID
 * @param {Object} event.data       - template data (key-value pairs)
 * @param {string} [event.page]     - optional page path to open on tap
 */
exports.main = async (event) => {
  const { toOpenId, templateId, data, page } = event;

  if (!toOpenId || !templateId || !data) {
    return { errCode: -1, errMsg: "missing required params: toOpenId, templateId, data" };
  }

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: toOpenId,
      templateId,
      data,
      page: page || "",
    });
    return result;
  } catch (err) {
    return { errCode: err.errCode || -1, errMsg: err.errMsg || err.message };
  }
};
