import Capacitor
import GameKit

@objc(CapacitorGameConnectPlugin)
public class CapacitorGameConnectPlugin: CAPPlugin, CAPBridgedPlugin, GKGameCenterControllerDelegate {
    public let identifier = "CapacitorGameConnectPlugin"
    public let jsName = "CapacitorGameConnect"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submitScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showLeaderboard", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showAllLeaderboards", returnType: CAPPluginReturnPromise)
    ]

    private var authenticationCall: CAPPluginCall?

    @objc public func signIn(_ call: CAPPluginCall) {
        let player = GKLocalPlayer.local
        if player.isAuthenticated {
            call.resolve()
            return
        }

        authenticationCall = call
        player.authenticateHandler = { [weak self] viewController, error in
            DispatchQueue.main.async {
                guard let self, let pendingCall = self.authenticationCall else { return }
                if let error {
                    self.authenticationCall = nil
                    pendingCall.reject("Game Center sign-in failed: \(error.localizedDescription)")
                    return
                }
                if let viewController {
                    guard let presenter = self.bridge?.viewController else {
                        self.authenticationCall = nil
                        pendingCall.reject("Cannot present the Game Center sign-in screen")
                        return
                    }
                    presenter.present(viewController, animated: true)
                    return
                }
                guard player.isAuthenticated else {
                    self.authenticationCall = nil
                    pendingCall.reject("Game Center sign-in was not completed")
                    return
                }
                self.authenticationCall = nil
                pendingCall.resolve()
            }
        }
    }

    @objc public func submitScore(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated else {
            call.reject("Sign in to Game Center before submitting a score")
            return
        }
        guard let leaderboardID = call.getString("leaderboardID"), !leaderboardID.isEmpty,
              let score = call.getInt("totalScoreAmount"), score >= 0 else {
            call.reject("A leaderboardID and non-negative totalScoreAmount are required")
            return
        }

        Task {
            do {
                try await GKLeaderboard.submitScore(
                    score,
                    context: 0,
                    player: GKLocalPlayer.local,
                    leaderboardIDs: [leaderboardID]
                )
                call.resolve()
            } catch {
                call.reject("Could not submit the Game Center score: \(error.localizedDescription)")
            }
        }
    }

    @objc public func showLeaderboard(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated else {
            call.reject("Sign in to Game Center before opening the leaderboard")
            return
        }
        guard let leaderboardID = call.getString("leaderboardID"), !leaderboardID.isEmpty else {
            call.reject("A leaderboardID is required")
            return
        }
        let controller = GKGameCenterViewController(
            leaderboardID: leaderboardID,
            playerScope: .global,
            timeScope: .allTime
        )
        present(controller, call: call)
    }

    @objc public func showAllLeaderboards(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated else {
            call.reject("Sign in to Game Center before opening the leaderboards")
            return
        }
        present(GKGameCenterViewController(state: .leaderboards), call: call)
    }

    public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }

    private func present(_ controller: GKGameCenterViewController, call: CAPPluginCall) {
        guard let presenter = bridge?.viewController else {
            call.reject("Cannot present the Game Center leaderboard")
            return
        }
        controller.gameCenterDelegate = self
        DispatchQueue.main.async {
            presenter.present(controller, animated: true)
            call.resolve()
        }
    }
}

class GameCenterBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(CapacitorGameConnectPlugin())
    }
}
