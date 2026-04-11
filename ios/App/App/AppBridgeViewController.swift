import UIKit
import Capacitor
import ObjectiveC

/// Custom bridge view controller that registers local Capacitor plugins.
/// The `bridge` Swift property is hidden behind a compiler feature gate
/// ($NonescapableTypes), so we use ObjC runtime to locate the bridge object
/// and call registerPluginInstance: on it.
class AppBridgeViewController: CAPBridgeViewController {

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        registerLocalPlugins()
    }

    private func registerLocalPlugins() {
        // Scan ivars of CAPBridgeViewController to find the CapacitorBridge
        // which conforms to @objc CAPBridgeProtocol (has registerPluginInstance:)
        let sel = NSSelectorFromString("registerPluginInstance:")
        var cls: AnyClass? = CAPBridgeViewController.self
        while let c = cls {
            var count: UInt32 = 0
            if let ivars = class_copyIvarList(c, &count) {
                for i in 0..<Int(count) {
                    if let raw = object_getIvar(self, ivars[i]) as AnyObject?,
                       raw.responds(to: sel) {
                        raw.perform(sel, with: SpeechRecognizerPlugin())
                        raw.perform(sel, with: NativeTtsPlugin())
                        free(ivars)
                        print("[AppBridge] Registered SpeechRecognizerPlugin & NativeTtsPlugin via ObjC runtime")
                        return
                    }
                }
                free(ivars)
            }
            cls = c.superclass()
        }
        print("[AppBridge] WARNING: Could not find bridge to register plugin")
    }
}
