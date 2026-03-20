export const responseHelper = {
  success: (pesan, data = null) => ({
    sukses: true,
    pesan,
    data,
    timestamp: new Date().toISOString()
  }),
  
  error: (pesan, errorRaw = null) => ({
    sukses: false,
    pesan,
    error: errorRaw?.message || errorRaw,
    timestamp: new Date().toISOString()
  })
};