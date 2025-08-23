# WebRTC Testing Guide

## Overview
This guide provides comprehensive testing strategies and troubleshooting information for the WebRTC integration in the meeting feature.

## Table of Contents
1. [Testing Environment Setup](#testing-environment-setup)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [Browser Testing](#browser-testing)
5. [Network Testing](#network-testing)
6. [Performance Testing](#performance-testing)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Testing Environment Setup

### Prerequisites
- Node.js 18+ and npm
- Modern browser with WebRTC support
- STUN/TURN server configuration
- Socket.IO server running

### Local Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run WebRTC tests
npm run test:webrtc

# Run all tests
npm run test
```

### Browser Requirements
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Unit Testing

### WebRTC Service Tests
```bash
# Run WebRTC service tests
npm run test src/services/__tests__/webrtcService.test.ts

# Run with coverage
npm run test:coverage src/services/__tests__/webrtcService.test.ts
```

### Test Coverage Areas
- **Local Media Stream Management**
  - Stream initialization
  - Error handling
  - Stream cleanup

- **Peer Connection Management**
  - Connection creation
  - Connection closure
  - Multiple connections

- **WebRTC Signaling**
  - Offer/Answer creation
  - ICE candidate handling
  - Remote description setting

- **Media Control**
  - Video/audio toggling
  - Camera switching
  - Screen sharing

- **Statistics and Monitoring**
  - Connection stats
  - Quality adaptation
  - Performance metrics

### Component Tests
```bash
# Run WebRTC component tests
npm run test src/components/webrtc/__tests__/

# Run specific component tests
npm run test src/components/webrtc/__tests__/WebRTCVideo.test.tsx
```

## Integration Testing

### Meeting Room Integration
```bash
# Run meeting room integration tests
npm run test src/features/meetings/components/__tests__/MeetingRoom.test.tsx
```

### Socket.IO Integration
```bash
# Run socket service tests
npm run test src/services/__tests__/socketService.test.ts
```

### End-to-End Testing
```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- --grep "WebRTC"
```

## Browser Testing

### Manual Testing Checklist

#### Connection Setup
- [ ] Camera and microphone permissions granted
- [ ] Local video stream displays correctly
- [ ] Audio levels are detected
- [ ] Connection to signaling server established

#### Peer-to-Peer Communication
- [ ] Remote video streams display
- [ ] Audio is transmitted and received
- [ ] Video quality is acceptable
- [ ] Connection stability maintained

#### Media Controls
- [ ] Video can be enabled/disabled
- [ ] Audio can be enabled/disabled
- [ ] Camera switching works
- [ ] Screen sharing functions properly

#### Quality Adaptation
- [ ] Quality adjusts based on network conditions
- [ ] Bandwidth usage is optimized
- [ ] Performance metrics are accurate

### Browser-Specific Testing

#### Chrome
```bash
# Enable WebRTC logging
chrome://webrtc-internals/

# Test with different network conditions
chrome://net-internals/#throttling
```

#### Firefox
```bash
# Enable WebRTC logging
about:webrtc

# Test with different network conditions
about:networking
```

#### Safari
```bash
# Enable WebRTC debugging
Develop > WebRTC > Show WebRTC Inspector
```

## Network Testing

### Network Conditions Testing
```bash
# Simulate different network conditions
npm run test:network

# Test with specific bandwidth limits
npm run test:network -- --bandwidth=1000
```

### Network Scenarios
1. **High Bandwidth (10+ Mbps)**
   - Should use high quality settings
   - Minimal packet loss
   - Low latency

2. **Medium Bandwidth (1-5 Mbps)**
   - Should adapt to medium quality
   - Moderate packet loss acceptable
   - Reasonable latency

3. **Low Bandwidth (<1 Mbps)**
   - Should use low quality settings
   - Higher packet loss expected
   - May have higher latency

4. **Unstable Connection**
   - Should handle reconnections
   - Quality adaptation
   - Error recovery

### STUN/TURN Server Testing
```bash
# Test STUN server connectivity
npm run test:stun

# Test TURN server connectivity
npm run test:turn
```

## Performance Testing

### Load Testing
```bash
# Test with multiple concurrent users
npm run test:load -- --users=10

# Test with different room sizes
npm run test:load -- --room-size=5
```

### Performance Metrics
- **Connection Time**: < 3 seconds
- **Video Quality**: 720p minimum
- **Audio Quality**: Clear, no echo
- **Latency**: < 200ms
- **Bandwidth Usage**: < 2 Mbps per user

### Memory Usage Testing
```bash
# Monitor memory usage
npm run test:memory

# Test memory leaks
npm run test:memory-leak
```

## Troubleshooting

### Common Issues

#### 1. Camera/Microphone Access Denied
**Symptoms**: No local video/audio
**Solutions**:
- Check browser permissions
- Ensure HTTPS is used (required for getUserMedia)
- Clear browser cache and permissions

#### 2. Connection Failures
**Symptoms**: Cannot connect to peers
**Solutions**:
- Check STUN/TURN server configuration
- Verify network connectivity
- Check firewall settings

#### 3. Poor Video Quality
**Symptoms**: Blurry or choppy video
**Solutions**:
- Check network bandwidth
- Verify camera resolution
- Adjust quality settings

#### 4. Audio Issues
**Symptoms**: No audio, echo, or poor quality
**Solutions**:
- Check microphone permissions
- Verify audio device selection
- Test with different audio devices

#### 5. Screen Sharing Issues
**Symptoms**: Cannot share screen
**Solutions**:
- Check browser support
- Verify display permissions
- Test with different browsers

### Debug Tools

#### Browser Developer Tools
```javascript
// Enable WebRTC logging
localStorage.setItem('webrtc-debug', 'true');

// Check WebRTC stats
webrtcService.getAllConnectionStats().then(console.log);
```

#### Network Monitoring
```bash
# Monitor WebRTC traffic
tcpdump -i any -w webrtc.pcap

# Analyze with Wireshark
wireshark webrtc.pcap
```

#### Performance Monitoring
```javascript
// Monitor connection quality
setInterval(() => {
  webrtcService.getAllConnectionStats().then(stats => {
    console.log('Connection Stats:', stats);
  });
}, 5000);
```

## Best Practices

### Development
1. **Always test on multiple browsers**
2. **Use HTTPS in production**
3. **Implement proper error handling**
4. **Monitor performance metrics**
5. **Test with different network conditions**

### Testing
1. **Automate repetitive tests**
2. **Test edge cases**
3. **Monitor resource usage**
4. **Test accessibility features**
5. **Validate security measures**

### Deployment
1. **Use production STUN/TURN servers**
2. **Monitor server performance**
3. **Implement logging and analytics**
4. **Set up alerts for issues**
5. **Plan for scaling**

### Security
1. **Validate all inputs**
2. **Use secure signaling**
3. **Implement rate limiting**
4. **Monitor for abuse**
5. **Keep dependencies updated**

## Test Scripts

### Quick Test Suite
```bash
#!/bin/bash
# Run all WebRTC tests

echo "Running WebRTC unit tests..."
npm run test:unit:webrtc

echo "Running WebRTC integration tests..."
npm run test:integration:webrtc

echo "Running WebRTC browser tests..."
npm run test:browser:webrtc

echo "Running WebRTC performance tests..."
npm run test:performance:webrtc

echo "All WebRTC tests completed!"
```

### Network Simulation
```bash
#!/bin/bash
# Test with different network conditions

echo "Testing with high bandwidth..."
npm run test:network -- --bandwidth=10000

echo "Testing with medium bandwidth..."
npm run test:network -- --bandwidth=2000

echo "Testing with low bandwidth..."
npm run test:network -- --bandwidth=500

echo "Testing with unstable connection..."
npm run test:network -- --unstable
```

## Continuous Integration

### GitHub Actions
```yaml
name: WebRTC Tests
on: [push, pull_request]

jobs:
  webrtc-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:webrtc
      - run: npm run test:coverage:webrtc
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:webrtc:quick"
    }
  }
}
```

## Resources

### Documentation
- [WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.IO Documentation](https://socket.io/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Tools
- [WebRTC Internals](chrome://webrtc-internals/)
- [WebRTC Test](https://webrtc.github.io/samples/)
- [Network Link Conditioner](https://developer.apple.com/download/more/)

### Community
- [WebRTC GitHub](https://github.com/webrtc)
- [Stack Overflow WebRTC](https://stackoverflow.com/questions/tagged/webrtc)
- [WebRTC Slack](https://webrtc-slack.herokuapp.com/)

---

**Note**: This guide should be updated regularly as WebRTC standards and browser implementations evolve.




